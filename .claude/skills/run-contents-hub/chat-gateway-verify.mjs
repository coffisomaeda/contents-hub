// AI Gateway 動作確認用: ログイン → チャット送信 → 応答待ち。
// /api/chat のレスポンスを捕捉して結果を表示する。
//
// playwright は frontend/ の devDependencies にあるため、リポジトリ内の相対パスで
// 解決する（絶対パスをハードコードせず、他環境でも動くようにする）。
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const playwrightEntry = resolve(here, '../../../frontend/node_modules/@playwright/test/index.mjs');
const { chromium } = await import(playwrightEntry);

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const EMAIL = 'test1@example.com';
const PASSWORD = 'password123';
// 楽天 API（書籍・ゲーム）はローカル未設定だと失敗するため、確認は映画（TMDB）で行う。
const MESSAGE = process.env.CHAT_MESSAGE || '映画のインターステラーを気になるで登録して';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();

  // ログイン
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) throw new Error('ログイン失敗');
  console.log('✓ ログイン完了');

  // /api/chat のレスポンスを待ち受ける
  const chatResp = page.waitForResponse(
    (r) => r.url().includes('/api/chat') && r.request().method() === 'POST',
    { timeout: 90000 },
  );

  // メッセージ送信
  await page.fill('input[placeholder*="AIにコンテンツ"]', MESSAGE);
  await page.locator('button:has-text("送信")').click();
  console.log(`✓ 送信: ${MESSAGE}`);

  const resp = await chatResp;
  console.log(`✓ /api/chat ステータス: ${resp.status()}`);
  const body = await resp.json().catch(() => null);
  if (body) {
    console.log('  reply:', (body.reply || '').slice(0, 120));
    console.log(
      '  registeredContent:',
      body.registeredContent ? body.registeredContent.title : null,
    );
    console.log('  error:', body.error || null);
  }
} finally {
  await browser.close();
}
