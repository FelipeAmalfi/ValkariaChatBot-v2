import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  baseURL: 'http://localhost:3000',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -w @valkaria/web',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
