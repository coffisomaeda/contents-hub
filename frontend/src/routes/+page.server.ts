import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// フロントに渡すチャット履歴 1 件分。
export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  registeredContent: unknown | null;
}

interface ChatMessageRow {
  id: string;
  role: string;
  content: string;
  registered_content: string | null;
  created_at: number;
}

// 現在アクティブなセッション（conversation_id）を決める。
// 明示的なポインタがあればそれを使い、なければ最新メッセージの会話をアクティブとみなす。
// ポインタと最新メッセージの 2 つの解決クエリは依存しないため、batch で 1 往復にまとめる。
const resolveActiveConversationId = async (
  db: D1Database,
  userId: string,
): Promise<string | null> => {
  const [pointer, latest] = await db.batch<{ conversation_id: string }>([
    db.prepare('SELECT conversation_id FROM chat_active_sessions WHERE user_id = ?').bind(userId),
    db
      .prepare(
        'SELECT conversation_id FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      )
      .bind(userId),
  ]);

  return pointer.results[0]?.conversation_id ?? latest.results[0]?.conversation_id ?? null;
};

// 指定セッションのメッセージを時系列で読み出す。
const loadSessionMessages = async (
  db: D1Database,
  userId: string,
  conversationId: string,
): Promise<ChatHistoryMessage[]> => {
  const { results } = await db
    .prepare(
      `SELECT id, role, content, registered_content, created_at
       FROM chat_messages
       WHERE user_id = ? AND conversation_id = ?
       ORDER BY created_at ASC
       LIMIT 200`,
    )
    .bind(userId, conversationId)
    .all<ChatMessageRow>();

  return (results ?? []).map((row) => ({
    id: row.id,
    role: row.role === 'user' ? 'user' : 'model',
    content: row.content,
    registeredContent: row.registered_content ? JSON.parse(row.registered_content) : null,
  }));
};

export const load: PageServerLoad = async ({ locals, platform }) => {
  const { session, user } = await locals.safeGetSession();
  if (!session || !user) {
    redirect(302, '/login');
  }

  const db = platform?.env?.DB;
  if (!db) {
    return { history: [] as ChatHistoryMessage[], conversationId: null as string | null };
  }

  try {
    const conversationId = await resolveActiveConversationId(db, user.id);
    if (!conversationId) {
      return { history: [] as ChatHistoryMessage[], conversationId: null as string | null };
    }
    return {
      history: await loadSessionMessages(db, user.id, conversationId),
      conversationId,
    };
  } catch (error) {
    console.error('chat history load error:', error);
    return { history: [] as ChatHistoryMessage[], conversationId: null as string | null };
  }
};

export const actions: Actions = {
  // 新しいセッションに切り替える（＝画面上の履歴をクリア）。
  // 過去のメッセージは削除せず、ポインタを新しい conversation_id に向けるだけ。
  newSession: async ({ locals, platform }) => {
    const { session, user } = await locals.safeGetSession();
    if (!session || !user) {
      return fail(401, { message: '認証が必要です。' });
    }

    const conversationId = crypto.randomUUID();
    const db = platform?.env?.DB;
    if (!db) {
      return { success: true, conversationId };
    }

    try {
      await db
        .prepare(
          `INSERT INTO chat_active_sessions (user_id, conversation_id, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             conversation_id = excluded.conversation_id,
             updated_at = excluded.updated_at`,
        )
        .bind(user.id, conversationId, Date.now())
        .run();
      return { success: true, conversationId };
    } catch (error) {
      console.error('chat new session error:', error);
      return fail(500, { message: 'セッションの切り替えに失敗しました。' });
    }
  },
};
