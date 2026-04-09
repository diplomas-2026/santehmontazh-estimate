import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    viewport: { width: 1440, height: 1200 },
    screenshot: 'off',
  },
  reporter: 'list',
});
