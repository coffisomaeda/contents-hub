#!/usr/bin/env node
/**
 * contents-hub smoke driver
 * Usage:
 *   node driver.mjs [--url http://localhost:5173] [--out /tmp/shots] [--scenario <name>]
 *
 * Scenarios:
 *   smoke    (default) ログイン → AIチャット → コンテンツ一覧 → スクリーンショット
 *   login    ログイン画面のみ
 *   contents ログイン済みのコンテンツ一覧
 *   register ログイン済みのコンテンツ登録画面
 */

import { chromium } from '/home/maeda/private/contents-hub/frontend/node_modules/@playwright/test/index.mjs';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const args = process.argv.slice(2);
const get = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};

const BASE_URL = get('--url', 'http://localhost:5173');
const OUT_DIR = get('--out', '/tmp/run-contents-hub-shots');
const SCENARIO = get('--scenario', 'smoke');

const EMAIL = 'test1@example.com';
const PASSWORD = 'password123';
const CHROMIUM = '/home/maeda/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome';

if (!existsSync(CHROMIUM)) {
  console.error(`Chromium not found: ${CHROMIUM}`);
  console.error('Run: cd frontend && npx playwright install chromium');
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: CHROMIUM,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

async function login() {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await page.waitForLoadState('networkidle');
  const url = page.url();
  if (url.includes('/login')) throw new Error(`ログイン失敗: ${url}`);
  console.log(`✓ ログイン完了 → ${url}`);
}

async function shot(name) {
  const path = `${OUT_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📷 ${path}`);
  return path;
}

if (SCENARIO === 'smoke') {
  // ログイン前 → ログイン画面へリダイレクトされることを確認
  await page.goto(`${BASE_URL}/`);
  await page.waitForLoadState('networkidle');
  await shot('01-unauthenticated');

  // ログイン
  await login();
  await shot('02-ai-chat');

  // コンテンツ一覧
  await page.goto(`${BASE_URL}/contents`);
  await page.waitForLoadState('networkidle');
  await shot('03-contents-list');

  // コンテンツ登録
  await page.goto(`${BASE_URL}/contents/new`);
  await page.waitForLoadState('networkidle');
  await shot('04-register');
} else if (SCENARIO === 'login') {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await shot('login');
} else if (SCENARIO === 'contents') {
  await login();
  await page.goto(`${BASE_URL}/contents`);
  await page.waitForLoadState('networkidle');
  await shot('contents');
} else if (SCENARIO === 'register') {
  await login();
  await page.goto(`${BASE_URL}/contents/new`);
  await page.waitForLoadState('networkidle');
  await shot('register');
} else {
  console.error(`不明なシナリオ: ${SCENARIO}`);
  process.exit(1);
}

await browser.close();
console.log(`\n完了。スクリーンショット: ${OUT_DIR}`);
