import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/renderer/src/e2e',
  timeout: 30000,
});