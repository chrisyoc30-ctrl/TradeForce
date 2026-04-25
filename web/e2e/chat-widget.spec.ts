import { expect, test } from "./fixtures";

test.describe("AI chat widget", () => {
  test("opens and shows dialog", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open tradescore support chat/i }).click();
    await expect(
      page.getByRole("dialog", { name: /tradeScore assistant/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder(/ask about leads/i)).toBeVisible();
  });
});
