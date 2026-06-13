/**
 * Contents Hub スクリーンショット撮影スクリプト
 *
 * 使い方:
 *   node take-screenshots.js [--scenario <name>] [--out <dir>]
 *
 * シナリオ:
 *   register  コンテンツ検索・登録フロー（デフォルト）
 *   library   ライブラリ一覧
 *   settings  設定ページ
 *
 * オプション:
 *   --out <dir>   出力先ディレクトリ（デフォルト: /tmp）
 *   --width <n>   ビューポート幅（デフォルト: 1280）
 *   --height <n>  ビューポート高さ（デフォルト: 800）
 */

const {
  chromium,
} = require('/home/maeda/private/contents-hub/frontend/node_modules/@playwright/test');
const path = require('path');

const APP_URL = 'http://localhost:5173';
const TEST_EMAIL = 'test1@example.com';
const TEST_PASSWORD = 'password123';

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const SCENARIO = getArg('--scenario') || 'register';
const OUT_DIR = getArg('--out') || '/tmp';
const WIDTH = parseInt(getArg('--width') || '1280', 10);
const HEIGHT = parseInt(getArg('--height') || '800', 10);

const shot = (name) => path.join(OUT_DIR, `screenshot-${name}.png`);

async function login(page) {
  await page.goto(`${APP_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  // ヘッダーのログアウトボタンと区別するため form 内の submit を使う
  await page.locator('form button[type="submit"]').click();
  await page.waitForLoadState('networkidle');
  if (!page.url().includes('/login')) {
    console.log('✓ ログイン成功');
  } else {
    throw new Error('ログインに失敗しました');
  }
}

async function scenarioRegister(page) {
  // 1. 登録ページ初期状態
  await page.goto(`${APP_URL}/contents/new`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: shot('register-01-new-page') });
  console.log('✓ 01-new-page');

  // 2. 種別選択 + キーワード入力
  // ラジオボタンは画像に隠れているため label をクリック
  await page.locator('label:has(input[name="mediaType"][value="movie"])').click();
  await page.fill('input[name="query"]', 'inception');
  await page.screenshot({ path: shot('register-02-search-input') });
  console.log('✓ 02-search-input');

  // 3. 検索実行 → article 出現を待つ（use:enhance は fetch なので networkidle では検知不可）
  await page.locator('button:has-text("検索")').first().click();
  await page.waitForSelector('article', { timeout: 20000 });
  await page.screenshot({ path: shot('register-03-search-results') });
  console.log('✓ 03-search-results');

  // 4. 登録フォームを開く
  await page.locator('article button:has-text("登録")').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot('register-04-form-top') });
  console.log('✓ 04-form-top');

  // 5. ステータス・評価・メモを入力した状態
  await page.selectOption('select[name="status"]', 'done');
  await page.fill('input[name="rating"]', '5');
  await page.fill('textarea[name="memo"]', '傑作');
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot('register-05-form-filled') });
  console.log('✓ 05-form-filled');

  // 6. 登録実行 → 成功メッセージ内の「詳細を見る」が出るまで待つ
  await page.locator('form[action="?/register"] button[type="submit"]').click();
  try {
    await page.waitForFunction(() => document.querySelector('[role="status"] a') !== null, {
      timeout: 30000,
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await page.screenshot({ path: shot('register-06-complete') });
    console.log('✓ 06-complete');
  } catch {
    console.warn('⚠ 登録完了メッセージを検知できませんでした（すでに登録済みの可能性）');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: shot('register-06-complete') });
  }
}

async function scenarioLibrary(page) {
  await page.goto(`${APP_URL}/contents`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: shot('library-01-list'), fullPage: false });
  console.log('✓ library-01-list');
}

async function scenarioSettings(page) {
  await page.goto(`${APP_URL}/settings`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: shot('settings-01-page') });
  console.log('✓ settings-01-page');
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });

  try {
    await login(page);

    switch (SCENARIO) {
      case 'register':
        await scenarioRegister(page);
        break;
      case 'library':
        await scenarioLibrary(page);
        break;
      case 'settings':
        await scenarioSettings(page);
        break;
      default:
        console.error(`未知のシナリオ: ${SCENARIO}`);
        process.exit(1);
    }

    console.log(`\n完了: ${OUT_DIR}/screenshot-*.png`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('エラー:', e.message);
  process.exit(1);
});
