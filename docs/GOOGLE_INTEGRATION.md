# Google アカウント連携と Google カレンダー登録の構築手順

このドキュメントでは、Supabase と SvelteKit を用いて Google アカウントでのログイン（OAuth）を実装し、さらに将来的にユーザーの Google カレンダーへ予定を登録できるようにするための手順をまとめています。

## 1. Google Cloud Platform (GCP) の設定

1. **プロジェクトの準備**
   - [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成または選択します。
2. **Google Calendar API の有効化**
   - 「API とサービス」 > 「ライブラリ」から **Google Calendar API** を検索し、「有効にする」をクリックします。
3. **OAuth 同意画面の設定**
   - 「API とサービス」 > 「OAuth 同意画面」を選択し、アプリ情報を入力します（テスト段階では User Type を「外部」にし、テストユーザーを登録）。
   - **スコープ**の設定で、カレンダーの予定を作成・編集できる権限（`https://www.googleapis.com/auth/calendar.events`）を追加します。
4. **OAuth クライアント ID の作成**
   - 「認証情報」 > 「＋ 認証情報を作成」 > 「OAuth クライアント ID」を選択します。
   - 「アプリケーションの種類」を「ウェブ アプリケーション」に設定します。
   - 「承認済みのリダイレクト URI」に以下を追加します：
     - リモート環境: `https://<あなたのSupabaseプロジェクトID>.supabase.co/auth/v1/callback`
     - ローカル環境: `http://127.0.0.1:54321/auth/v1/callback` (または使用中のローカルSupabaseのポート)
   - 発行される **クライアント ID** と **クライアント シークレット** を控えておきます。

## 2. Supabase の設定

### リモート環境（本番）

1. Supabase ダッシュボードで対象プロジェクトを開きます。
2. 「Authentication」 > 「Providers」 > 「Google」を有効化します。
3. GCP で取得した Client ID と Client Secret を入力して保存します。

### ローカル開発環境

`supabase/config.toml` を編集し、Google プロバイダーを有効化します。

```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
# redirect_uri はデフォルトでローカルのAPIに設定されます
```

そして `.env` ファイルなどに `GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` を定義しておきます。

## 3. SvelteKit 側の実装 (フロントエンド)

### 3.1. Google ログインとカレンダー権限の要求

ログイン画面（例: `frontend/src/routes/login/+page.svelte`）に Google ログインボタンを配置し、`signInWithOAuth` を呼び出します。このとき、将来のカレンダー操作のためにスコープとリフレッシュトークンの取得オプション（`offline`）を指定します。

```svelte
<script lang="ts">
  import { createClient } from '$lib/supabase/client';

  const signInWithGoogle = async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // カレンダー操作の権限を要求
        scopes: 'https://www.googleapis.com/auth/calendar.events',
        // トークンを後から再取得できるようにするための設定
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('Googleログインエラー:', error.message);
    }
  };
</script>

<button type="button" onclick={signInWithGoogle}>
  Google アカウントでログイン
</button>
```

※認証後のリダイレクト先 (`/auth/callback`) でセッションを確定する処理 (`exchangeCodeForSession`) は既に実装済みのものをそのまま利用できます。

### 3.2. Google カレンダーへの登録処理 (サーバー側)

フロントエンドから日付データを受け取り、SvelteKit のサーバー側処理 (`+page.server.ts` など) で Google Calendar API を呼び出して予定を作成します。Supabase のセッションに含まれる `provider_token` (Google のアクセストークン) を使用します。

```typescript
// frontend/src/routes/calendar/+page.server.ts の実装例
export const actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const eventDate = formData.get('date');
    const eventTitle = formData.get('title');

    // 現在のユーザーセッションを取得
    const {
      data: { session },
    } = await locals.supabase.auth.getSession();

    // Googleのアクセストークンは provider_token に格納されています
    const googleAccessToken = session?.provider_token;

    if (!googleAccessToken) {
      return { error: 'Googleアカウントが連携されていません' };
    }

    // Google Calendar API のリクエストボディ作成
    const event = {
      summary: eventTitle,
      start: { date: eventDate }, // 時間指定の場合は dateTime を使用
      end: { date: eventDate },
    };

    // Google Calendar API へ POST
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    );

    if (!response.ok) {
      console.error('カレンダー登録失敗', await response.text());
      return { error: 'カレンダーへの登録に失敗しました' };
    }

    return { success: true };
  },
};
```

## 運用上の注意点: リフレッシュトークンの管理

Supabase セッションから取得できる `session.provider_token` (アクセストークン) は、通常 **1時間** で有効期限が切れます。

ログイン直後にカレンダー登録する場合はアクセストークンをそのまま利用できますが、ログインしてから時間が経過した後や、バックグラウンド処理でカレンダーを操作する場合は、初回のログイン時に取得できる `provider_refresh_token` をアプリケーションのデータベース等に保存しておく必要があります。そして、有効期限切れの際には、保存したリフレッシュトークンを用いて手動で新しいアクセストークンを Google から再取得する仕組みを構築してください。
