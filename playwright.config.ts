import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Certains environnements (CI, conteneurs) fournissent deja un Chromium :
 * on l'utilise s'il existe, sinon Playwright prend celui qu'il a installe.
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
    trace: 'retain-on-failure',
    launchOptions,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
  webServer: [
    {
      command: 'npm run dev -w server',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      env: { PORT: '3001', CLIENT_URL: `http://127.0.0.1:${PORT}`, NODE_ENV: 'test' },
    },
    {
      // Le client est construit en pointant directement vers le serveur
      // Socket.IO : les tests traversent exactement le chemin de production
      // (front statique + backend separe), sans proxy intermediaire.
      command: `npm run build -w client && npx vite preview --config client/vite.config.ts --port ${PORT} --strictPort`,
      env: { VITE_SERVER_URL: 'http://127.0.0.1:3001' },
      port: PORT,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      timeout: 180_000,
    },
  ],
});
