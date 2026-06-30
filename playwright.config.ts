import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? "3300");
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // The environment pre-installs a fixed Chromium build and disables
        // downloads; point Playwright at the full binary (skips the bundled
        // headless-shell version check).
        launchOptions: process.env.PW_CHROMIUM_PATH
          ? { executablePath: process.env.PW_CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: {
    // Cold runs build then serve; if a server is already on the port, reuse it.
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
