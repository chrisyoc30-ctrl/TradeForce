import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: process.env.CI
    ? [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
    : [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "mobile", use: { ...devices["iPhone 12"] } },
      ],
  webServer: {
    /** CI runs `npm run build` first, then only `next start` here. Locally, full build+start. */
    command: process.env.CI
      ? `npx next start -p ${port}`
      : "npm run test:e2e:server",
    url: `${baseURL}/api/health`,
    reuseExistingServer: true,
    timeout: process.env.CI ? 120_000 : 600_000,
  },
});
