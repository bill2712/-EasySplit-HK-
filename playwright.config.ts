import { defineConfig, devices } from '@playwright/test';

// UI tests run against a production build that talks to the Firestore emulator
// (see `npm run test:e2e`).
export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173/-EasySplit-HK-/',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    ...devices['Pixel 7'],
  },
  webServer: {
    command: 'npx vite preview --outDir dist-e2e --port 4173 --strictPort',
    url: 'http://localhost:4173/-EasySplit-HK-/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
