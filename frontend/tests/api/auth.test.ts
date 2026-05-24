import { test, expect } from '@playwright/test';
import { APP_ORIGIN } from './utils';

test.describe('Auth API (SvelteKit Form Actions)', () => {
  // 1. ログイン失敗（存在しないユーザーや誤ったパスワード）のテスト
  test('POST /login with invalid credentials returns action failure', async ({ request }) => {
    const response = await request.post('/login', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
        // HTMLではなくJSONフォーマットでアクションの結果を受け取るため
        Accept: 'application/json',
      },
      // URLSearchParams相当の形式で送信
      data: 'email=invalid@example.com&password=wrongpassword',
    });

    // ActionFailure の場合、ステータスは 200 で返りペイロードにエラー内容が含まれる
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.type).toBe('failure');
    expect(body.status).toBe(400);

    // 返却データの中に指定したエラーメッセージが含まれていることを確認
    const dataStr = JSON.stringify(body.data);
    expect(dataStr).toContain('ログインに失敗しました');
  });

  // 2. 登録バリデーション失敗（パスワード短すぎ）のテスト
  test('POST /signup with short password returns action failure', async ({ request }) => {
    const response = await request.post('/signup', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
        Accept: 'application/json',
      },
      data: 'email=test@example.com&password=123',
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.type).toBe('failure');
    expect(body.status).toBe(400);

    const dataStr = JSON.stringify(body.data);
    expect(dataStr).toContain('パスワードは6文字以上で入力してください。');
  });

  // 3. ログアウトのテスト（Cookieなしで呼び出した場合の挙動）
  test('POST /logout without session', async ({ request }) => {
    const response = await request.post('/logout', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
      },
      maxRedirects: 0, // リダイレクトを自動追従しない
    });

    // ログアウト処理は /login にリダイレクトする (303 See Other)
    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toBe('/login');
  });

  // 4. ログイン成功のテスト（正常系）
  // 依存: Local Supabaseのシードデータ (test1@example.com / password123)
  test('POST /login with valid credentials successfully redirects and sets cookie', async ({
    request,
  }) => {
    const response = await request.post('/login', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
        Accept: 'application/json', // ActionResultとして受け取る
      },
      data: 'email=test1@example.com&password=password123',
      maxRedirects: 0,
    });

    // 成功時は / にリダイレクトされるアクションレスポンスが返るか、
    // HTTPステータス303でリダイレクトされる（Actionの挙動による）

    // API経由で x-sveltekit-action を付与せず Accept: application/json のみの場合、
    // SvelteKitは Action の結果としてのJSON { type: 'redirect', location: '/' } を 200 で返す
    // または maxRedirects=0 なので通常の Form Submit 扱いで 303 を返す

    // 実際に SvelteKit がどのように返すか柔軟に対応
    if (response.status() === 303) {
      expect(response.headers()['location']).toBe('/');
    } else {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.type).toBe('redirect');
      expect(body.location).toBe('/');
    }

    // AuthセッションのCookie（sb-[ID]-auth-token等）がセットされていることを確認
    const setCookie = response.headers()['set-cookie'];
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('sb-');
  });
});
