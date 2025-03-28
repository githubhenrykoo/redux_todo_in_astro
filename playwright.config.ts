import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: process.env.CI 
      ? 'http://localhost:4322' 
      : 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* Comment out these browsers for faster testing during development
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    */
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4322',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI
  }
});
