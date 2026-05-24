import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  webServer: [
    {
      command: 'node tests/api/watchmode-mock-server.mjs',
      url: 'http://127.0.0.1:5174/health',
      reuseExistingServer: false,
      timeout: 120 * 1000,
    },
    {
      command: 'pnpm dev --host 127.0.0.1 --port 5175',
      url: 'http://127.0.0.1:5175',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
        PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
        WATCHMODE_API_KEY: process.env.WATCHMODE_API_KEY ?? 'playwright-watchmode-key',
        WATCHMODE_API_BASE_URL: process.env.WATCHMODE_API_BASE_URL ?? 'http://127.0.0.1:5174/v1',
      },
    },
  ],
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://127.0.0.1:5175',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
