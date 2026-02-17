import { defineConfig, devices } from '@playwright/test';

/**
 * Autonomous E2E Testing Configuration
 * Dedicated config for the autonomous testing pipeline
 * Supports env-based baseURL for multi-target testing
 */
export default defineConfig({
  testDir: '../tests/e2e/autonomous',
  fullyParallel: false, // Run sequentially for reliability
  forbidOnly: true,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: '../reports/html' }],
    ['json', { outputFile: '../reports/test-results.json' }],
    ['list'],
  ],

  use: {
    baseURL: process.env['TEST_TARGET_URL'] || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  timeout: 60000, // 60s default, AI tests override to 120s
  expect: {
    timeout: 10000,
  },

  projects: [
    {
      name: 'Mobile',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Mini'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  // Only start webServer if testing localhost
  ...(process.env['TEST_TARGET_URL']?.includes('localhost') || !process.env['TEST_TARGET_URL']
    ? {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 120000,
          cwd: '../../',
        },
      }
    : {}),
});
