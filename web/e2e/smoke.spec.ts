import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/TradeScore/i);
  });

  test("health endpoint returns ok JSON", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.service).toBe("tradescore-web");
  });

  test("legal pages respond", async ({ page }) => {
    for (const path of ["/terms", "/privacy", "/faq"]) {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();
    }
  });
});
