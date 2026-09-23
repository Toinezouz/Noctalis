import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const PORT = 3001;

/**
 * Some environments (CI, containers) already ship a Chromium: use it when it
 * exists, otherwise Playwright takes the one it installed.
 */
const PREINSTALLED_CHROMIUM = process.env['PW_CHROMIUM_PATH'] ?? '/opt/pw-browsers/chromium';
const launchOptions = existsSync(PREINSTALLED_CHROMIUM)
  ? { executablePath: PREINSTALLED_CHROMIUM }
  : {};

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // English, the game's default language; translation specs set their own.
    locale: 'en-US',
    trace: 'retain-on-failure',
    launchOptions,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
  /**
   * A single server, the production one: Express serves the built client,
   * the API and Socket.IO on the same origin. That is exactly what the host
   * runs, so the tests go through the real path.
   *
   * `NODE_ENV=test` keeps the leak guard on during the tests.
   */
  webServer: {
    command: 'npm run build && npm start',
    // Wait for a real answer from the app, not just an open port.
    url: `http://127.0.0.1:${String(PORT)}/health`,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 300_000,
    env: {
      PORT: String(PORT),
      NODE_ENV: 'test',
    },
  },
});
