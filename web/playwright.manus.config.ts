/**
 * External Manus app audit — no local webServer.
 * Usage: npx playwright test --config=playwright.manus.config.ts
 */
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.MANUS_BASE_URL ?? "https://manus.im";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "on",
    video: "retain-on-failure",
    ignoreHTTPSErrors: false,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Intentionally no webServer — tests target live Manus.
});
