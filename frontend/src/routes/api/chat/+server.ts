import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOpenAI } from '@ai-sdk/openai';
import { createWorkersAI } from 'workers-ai-provider';
import { generateText, tool, type ModelMessage, stepCountIs } from 'ai';
import { z } from 'zod';
import { createRakutenClient } from '$lib/server/external/rakuten';
import { createTmdbClient } from '$lib/server/external/tmdb';
import { createWatchmodeClient } from '$lib/server/external/watchmode';
import { registerContentForUser } from '$lib/server/content-registration';
import type { ContentRegistrationInput } from '$lib/validation/content';

interface RegisteredContentInfo {
  mediaType: string;
  title: string;
  author?: string;
  hardware?: string;
  imageUrl?: string;
  isbn?: string;
  jan?: string;
  status: string;
  rating?: number;
  memo?: string;
  contentId: string;
  releaseDate?: string;
}

const chatRequestSchema = z.object({
  message: z.string().min(1, 'メッセージを入力してください。'),
  history: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
  // 1 回の会話をまとめる ID（フロントがページ表示ごとに発行）。
  // 後方互換のため任意。未指定なら単発会話として扱う。
  conversationId: z.string().optional(),
});

// チャット履歴を D1 に保存する（ベストエフォート。失敗してもチャット応答は止めない）。
const saveChatHistory = async (
  db: D1Database | undefined,
  params: {
    userId: string;
    conversationId: string;
    userMessage: string;
    assistantReply: string;
    registeredContent: RegisteredContentInfo | null;
  },
): Promise<void> => {
  if (!db) return;
  const { userId, conversationId, userMessage, assistantReply, registeredContent } = params;
  const now = Date.now();
  try {
    const stmt = db.prepare(
      `INSERT INTO chat_messages (id, user_id, conversation_id, role, content, registered_content, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    await db.batch([
      stmt.bind(crypto.randomUUID(), userId, conversationId, 'user', userMessage, null, now),
      stmt.bind(
        crypto.randomUUID(),
        userId,
        conversationId,
        'assistant',
        assistantReply,
        registeredContent ? JSON.stringify(registeredContent) : null,
        // ユーザー発言より後に並ぶよう +1ms。
        now + 1,
      ),
    ]);
  } catch (error) {
    console.error('chat history save error:', error);
  }
};

// 登録系ツールの共通パラメータ。query / status の説明だけ各ツールで差し替える。
// rating は数値を文字列で返すモデル（例: llama-3.3）にも耐えるよう coerce し、1〜5 に制限する。
const registerToolParams = (queryDesc: string, statusDesc: string) =>
  z.object({
    query: z.string().describe(queryDesc),
    status: z.enum(['want', 'doing', 'done']).describe(statusDesc),
    rating: z.coerce.number().min(1).max(5).optional().describe('評価（1〜5の数値、任意）'),
    memo: z.string().optional().describe('感想やメモ（任意）'),
  });

const bookToolParams = registerToolParams(
  '検索キーワード（例: 本のタイトルや著者名）',
  '読書ステータス',
);

const gameToolParams = registerToolParams(
  '検索キーワード（例: ゲームのタイトル）',
  'プレイステータス',
);

const videoToolParams = registerToolParams(
  '検索キーワード（例: 映画やアニメのタイトル）',
  '視聴ステータス',
).extend({
  media_type: z
    .enum(['movie', 'tv'])
    .describe('メディア種別（movie: 映画, tv: TV番組・アニメなど）'),
});

const getPrivateEnv = (platform: App.Platform | undefined, key: string): string | undefined => {
  const platformEnv = platform?.env as Record<string, string | undefined> | undefined;
  return env[key] ?? platformEnv?.[key];
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  // ユーザーセッション認証
  const { session, user } = await locals.safeGetSession();
  if (!session || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;

  // 使用する LLM を決定する。
  // 優先: Cloudflare Workers AI バインディング（platform.env.AI）。本番でも local dev(remote) でも動き、
  //       API キー不要で content フォーマットも Cloudflare 仕様で正しく送られる。
  // 代替: OpenAI 互換エンドポイント（Gemini や任意の互換 API）。AI_API_KEY で認証。
  //       ※ @ai-sdk/openai は openai.chat() を使うこと。openai() は Responses API になり
  //         Cloudflare/Gemini の互換エンドポイント（/chat/completions のみ対応）で失敗する。
  const aiBinding = platform?.env?.AI;
  const apiKey = getPrivateEnv(platform, 'AI_API_KEY') ?? getPrivateEnv(platform, 'GEMINI_API_KEY');
  const modelName =
    getPrivateEnv(platform, 'AI_MODEL') ??
    (aiBinding ? '@cf/qwen/qwen3-30b-a3b-fp8' : 'gemini-2.0-flash');

  if (!aiBinding && !apiKey) {
    return json(
      { error: 'AI バインディング、または AI_API_KEY / GEMINI_API_KEY のいずれかが必要です。' },
      { status: 500 },
    );
  }

  const rawBody = await request.json();
  const parsed = chatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return json(
      { error: parsed.error.issues[0]?.message || 'リクエストの形式が不正です。' },
      { status: 400 },
    );
  }
  const { message, history, conversationId } = parsed.data;

  // モデルの作成（バインディング優先、なければ OpenAI 互換）
  const model = aiBinding
    ? createWorkersAI({ binding: aiBinding })(modelName)
    : createOpenAI({
        apiKey,
        baseURL: getPrivateEnv(platform, 'AI_BASE_URL') || undefined,
      }).chat(modelName);

  // 登録されたコンテンツの情報をフロントエンドに返すための変数
  let registeredContentInfo: RegisteredContentInfo | null = null;

  // 外部APIクライアントの初期化
  const origin = request.headers.get('origin') ?? new URL(request.url).origin;
  const kv = platform?.env?.EXTERNAL_API_CACHE;

  const rakuten = createRakutenClient(
    kv,
    getPrivateEnv(platform, 'RAKUTEN_APP_ID'),
    getPrivateEnv(platform, 'RAKUTEN_ACCESS_KEY'),
  );
  const tmdb = createTmdbClient(kv, getPrivateEnv(platform, 'TMDB_API_KEY'));
  const watchmode = createWatchmodeClient(
    kv,
    getPrivateEnv(platform, 'WATCHMODE_API_KEY'),
    getPrivateEnv(platform, 'WATCHMODE_API_BASE_URL'),
  );

  // 履歴（Svelte側から渡される）を Vercel AI SDK 形式に変換
  const coreMessages: ModelMessage[] = [
    ...(history || []).map((h) => ({
      role: h.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: h.content,
    })),
    {
      role: 'user',
      content: message,
    },
  ];

  try {
    const result = await generateText({
      model,
      // 出力を決定的にしてトークン崩壊（fp8 量子化モデルでまれに起きる生成破綻）を抑える。
      // eval（temperature:0 で 8/8）と同条件に揃える意味もある。
      temperature: 0,
      system: `あなたは優秀なコンテンツ管理アシスタントです。
ユーザーの指示に従って、本、ゲーム、映像作品（映画やTV番組、アニメ）をライブラリに登録したり、登録されたコンテンツを検索したりします。
コンテンツの登録時には、自動的に適切な検索ツールを呼び出してください。
もし登録時にステータス（気になる: want, 読書中・プレイ中・視聴中: doing, 完了・読了・クリア: done）が指定されていない場合は、「気になる（want）」で登録してください。
評価（1〜5）やメモ（感想）も指定されていれば、ツールに渡してください。
登録に成功したら、ユーザーに対して登録完了したことを分かりやすく伝えてください。`,
      messages: coreMessages,
      stopWhen: stepCountIs(5), // 自動ツール実行ループの上限
      tools: {
        search_and_add_book: tool({
          description:
            '本のタイトルや著者名などのキーワードで検索し、ユーザーのライブラリに登録する。',
          inputSchema: bookToolParams,
          execute: async ({ query, status, rating, memo }) => {
            const searchRes = await rakuten.searchBooks(query, origin);
            if (!searchRes.results || searchRes.results.length === 0) {
              const regInput: ContentRegistrationInput = {
                mediaType: 'book',
                title: query,
                status,
                rating,
                memo,
                isEbook: false,
                isSold: false,
              };
              const res = await registerContentForUser(locals.supabase, userId, regInput);
              registeredContentInfo = {
                mediaType: 'book',
                title: query,
                status,
                rating,
                memo,
                contentId: res.contentId,
              };
              return {
                success: true,
                message: `検索結果がなかったため、タイトル「${query}」で登録しました。`,
                contentId: res.contentId,
              };
            }
            const topBook = searchRes.results[0];
            const regInput: ContentRegistrationInput = {
              mediaType: 'book',
              title: topBook.title,
              titleKana: topBook.titleKana,
              description: topBook.description,
              imageUrl: topBook.imageUrl,
              itemUrl: topBook.itemUrl,
              isbn: topBook.isbn,
              author: topBook.author,
              publisherName: topBook.publisherName,
              itemPrice: topBook.itemPrice,
              status,
              rating,
              memo,
              isEbook: false,
              isSold: false,
            };
            const res = await registerContentForUser(locals.supabase, userId, regInput);
            registeredContentInfo = {
              mediaType: 'book',
              title: topBook.title,
              author: topBook.author,
              imageUrl: topBook.imageUrl,
              isbn: topBook.isbn,
              status,
              rating,
              memo,
              contentId: res.contentId,
            };
            return {
              success: true,
              message: `「${topBook.title}」を登録しました。`,
              content: topBook,
              reusedContent: res.reusedContent,
            };
          },
        }),
        search_and_add_game: tool({
          description: 'ゲームのタイトルなどのキーワードで検索し、ユーザーのライブラリに登録する。',
          inputSchema: gameToolParams,
          execute: async ({ query, status, rating, memo }) => {
            const searchRes = await rakuten.searchGames(query, origin);
            if (!searchRes.results || searchRes.results.length === 0) {
              const regInput: ContentRegistrationInput = {
                mediaType: 'game',
                title: query,
                status,
                rating,
                memo,
                isEbook: false,
                isSold: false,
              };
              const res = await registerContentForUser(locals.supabase, userId, regInput);
              registeredContentInfo = {
                mediaType: 'game',
                title: query,
                status,
                rating,
                memo,
                contentId: res.contentId,
              };
              return {
                success: true,
                message: `検索結果がなかったため、タイトル「${query}」で登録しました。`,
                contentId: res.contentId,
              };
            }
            const topGame = searchRes.results[0];
            const regInput: ContentRegistrationInput = {
              mediaType: 'game',
              title: topGame.title,
              titleKana: topGame.titleKana,
              imageUrl: topGame.imageUrl,
              itemUrl: topGame.itemUrl,
              jan: topGame.jan,
              hardware: topGame.hardware,
              label: topGame.label,
              itemPrice: topGame.itemPrice,
              status,
              rating,
              memo,
              isEbook: false,
              isSold: false,
            };
            const res = await registerContentForUser(locals.supabase, userId, regInput);
            registeredContentInfo = {
              mediaType: 'game',
              title: topGame.title,
              hardware: topGame.hardware,
              imageUrl: topGame.imageUrl,
              jan: topGame.jan,
              status,
              rating,
              memo,
              contentId: res.contentId,
            };
            return {
              success: true,
              message: `「${topGame.title}」を登録しました。`,
              content: topGame,
              reusedContent: res.reusedContent,
            };
          },
        }),
        search_and_add_video: tool({
          description:
            '映画やTV番組、アニメなどのキーワードで検索し、ユーザーのライブラリに登録する。',
          inputSchema: videoToolParams,
          execute: async ({ query, media_type, status, rating, memo }) => {
            const searchRes = await tmdb.search(media_type, query);
            if (!searchRes.results || searchRes.results.length === 0) {
              return {
                success: false,
                message: `映像作品「${query}」の検索結果が見つかりませんでした。動画の登録にはTMDB IDが必要です。`,
              };
            }
            const topVideo = searchRes.results[0];
            const regInput: ContentRegistrationInput = {
              mediaType: media_type,
              title: topVideo.title,
              description: topVideo.description,
              imageUrl: topVideo.imageUrl,
              releaseDate: topVideo.releaseDate,
              tmdbId: topVideo.tmdbId,
              originalTitle: topVideo.originalTitle,
              posterPath: topVideo.posterPath,
              backdropPath: topVideo.backdropPath,
              genresJson: topVideo.genresJson,
              voteAverage: topVideo.voteAverage,
              voteCount: topVideo.voteCount,
              runtime: undefined,
              numberOfSeasons: undefined,
              numberOfEpisodes: undefined,
              videoStatus: topVideo.videoStatus,
              imdbId: undefined,
              watchmodeId: undefined,
              status,
              rating,
              memo,
              isEbook: false,
              isSold: false,
            };
            const res = await registerContentForUser(locals.supabase, userId, regInput, {
              watchmode,
            });
            registeredContentInfo = {
              mediaType: media_type,
              title: topVideo.title,
              imageUrl: topVideo.imageUrl,
              releaseDate: topVideo.releaseDate,
              status,
              rating,
              memo,
              contentId: res.contentId,
            };
            return {
              success: true,
              message: `「${topVideo.title}」を登録しました。`,
              content: topVideo,
              reusedContent: res.reusedContent,
            };
          },
        }),
        search_my_library: tool({
          description:
            'ユーザーがすでに登録している本、ゲーム、映像作品をキーワードで検索し、登録情報を確認する。',
          inputSchema: z.object({
            query: z.string().describe('検索キーワード（例: タイトルの一部）'),
          }),
          execute: async ({ query }) => {
            const escaped = query.trim().replace(/[%_\\]/g, '\\$&');
            const { data, error } = await locals.supabase
              .from('user_contents')
              .select(
                `
                id,
                status,
                rating,
                memo,
                contents!inner(id, title, media_type, image_url, release_date)
              `,
              )
              .eq('user_id', userId)
              .ilike('contents.title', `%${escaped}%`)
              .limit(10);

            if (error) {
              return { success: false, message: 'ライブラリ検索中にエラーが発生しました。' };
            }

            return {
              success: true,
              results: (data || []).map((item) => ({
                contentId: item.contents.id,
                title: item.contents.title,
                mediaType: item.contents.media_type,
                imageUrl: item.contents.image_url,
                status: item.status,
                rating: item.rating,
                memo: item.memo,
              })),
            };
          },
        }),
      },
    });

    // チャット履歴を D1 に保存（応答をブロックしないよう waitUntil に委ねる。
    // ctx が無い環境では即時 await）。
    const savePromise = saveChatHistory(platform?.env?.DB, {
      userId,
      conversationId: conversationId ?? crypto.randomUUID(),
      userMessage: message,
      assistantReply: result.text,
      registeredContent: registeredContentInfo,
    });
    if (platform?.ctx?.waitUntil) {
      platform.ctx.waitUntil(savePromise);
    } else {
      await savePromise;
    }

    return json({
      reply: result.text,
      registeredContent: registeredContentInfo,
    });
  } catch (error: unknown) {
    console.error('AI chat error:', error);
    return json({ error: 'AI処理中にエラーが発生しました。' }, { status: 500 });
  }
};
