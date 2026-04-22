import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/renderer/src/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'html',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
  },
});
