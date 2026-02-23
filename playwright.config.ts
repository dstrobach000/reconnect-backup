import { defineConfig, devices } from '@playwright/test';

const providedBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseUrl = providedBaseUrl || 'http://localhost:3200';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 45_000,
  expect: {
    timeout: 7_500,
  },
  reporter: [['list']],
  use: {
    baseURL: baseUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
  webServer: providedBaseUrl
    ? undefined
    : {
        command: 'npm run dev -- --hostname :: --port 3200',
        url: 'http://localhost:3200',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
