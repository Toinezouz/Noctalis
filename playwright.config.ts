import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const PORT = 3001;

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
  /**
   * Un seul serveur, celui de production : Express sert le client compile,
   * l'API et Socket.IO sur la meme origine. C'est exactement ce que lance
   * l'hebergeur, donc les tests traversent le vrai chemin — et il n'y a plus
   * de serveur d'apercu separe qui puisse ne pas demarrer.
   *
   * `NODE_ENV=test` garde le garde-fou anti-fuite actif pendant les tests.
   */
  webServer: {
    command: 'npm run build && npm start',
    // On attend une vraie reponse de l'application, pas juste un port ouvert.
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
