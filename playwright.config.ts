import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    headless: true,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    }
  },
  
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4322',
    timeout: 180 * 1000, 
    reuseExistingServer: false, 
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      PORT: '4322',
      NODE_ENV: process.env.CI ? 'production' : 'development'
    }
  },
  
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true
      },
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
});
