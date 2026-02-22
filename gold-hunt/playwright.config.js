/* global process */
import { defineConfig } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
