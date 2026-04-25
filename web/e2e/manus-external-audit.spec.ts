import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Live audit for a Manus-hosted app (public URL).
 * Path is relative to baseURL (playwright.manus.config.ts → https://manus.im).
 */
const MANUS_APP_PATH = "/app/BhvLBFWqDXXFisN9Dtpi4B";

function attachPageDiagnostics(page: Page, label: string, errors: string[], warnings: string[]) {
  page.on("pageerror", (err) => {
    errors.push(`[${label}] pageerror: ${err.message}`);
  });
  page.on("console", (msg) => {
    const t = msg.type();
    const text = msg.text();
    if (t === "error") errors.push(`[${label}] console.error: ${text}`);
    else if (t === "warning") warnings.push(`[${label}] console.warn: ${text}`);
  });
}

test.describe("Manus app external audit", () => {
  test("load, content, a11y, and runtime diagnostics", async ({ page, baseURL }, testInfo) => {
    const pageErrors: string[] = [];
    const consoleWarnings: string[] = [];
    attachPageDiagnostics(page, "app", pageErrors, consoleWarnings);

    const url = `${baseURL ?? "https://manus.im"}${MANUS_APP_PATH}`;
    const response = await page.goto(MANUS_APP_PATH, { waitUntil: "domcontentloaded", timeout: 60_000 });
    expect(response, "navigation should return a response").toBeTruthy();
    if (response) {
      testInfo.annotations.push({ type: "http", description: `status: ${response.status()}` });
    }
    // SPA: allow time for client bundle.
    await page.waitForTimeout(5_000);

    const title = await page.title();

    await testInfo.attach("title.txt", { body: `URL: ${url}\nTitle: ${title}\n`, contentType: "text/plain" });

    const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 2_000);
    await testInfo.attach("body-snippet.txt", { body: bodyText || "(empty or shadow)", contentType: "text/plain" });

    const axe = await new AxeBuilder({ page })
      .disableRules(["color-contrast", "landmark-unique"])
      .analyze();
    const serious = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
    const moderate = axe.violations.filter((v) => v.impact === "moderate");
    const axeSummary = {
      url,
      title,
      violationCount: axe.violations.length,
      serious: serious.map((v) => ({ id: v.id, help: v.help, impact: v.impact })),
      moderateCount: moderate.length,
    };
    await testInfo.attach("axe.json", { body: JSON.stringify(axeSummary, null, 2), contentType: "application/json" });

    if (serious.length > 0) {
      testInfo.annotations.push({ type: "issue", description: `Axe serious/critical: ${serious.length}` });
    }
    if (pageErrors.length > 0) {
      testInfo.annotations.push({ type: "issue", description: `Runtime console/page errors: ${pageErrors.length}` });
    }
    if (response) {
      expect(response.status(), "HTTP should be successful").toBeLessThan(400);
    }
    // Report-only: Manus platform may show sign-in, 401s without session, and host-specific a11y/CSP.
    // Do not fail the run on third-party shell issues; full JSON attached above.
    await testInfo.attach("console-errors.txt", {
      body: pageErrors.length ? pageErrors.join("\n\n") : "(none)",
      contentType: "text/plain",
    });
    await testInfo.attach("console-warnings.txt", {
      body: consoleWarnings.length ? consoleWarnings.join("\n\n") : "(none)",
      contentType: "text/plain",
    });
  });
});
