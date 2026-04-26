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

  test("sends a message and shows an assistant reply (no tRPC error banner)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open tradescore support chat/i }).click();
    const input = page.getByPlaceholder(/ask about leads/i);
    await input.fill("What does a lead cost?");
    await page.getByRole("button", { name: /send message/i }).click();
    // Scope to the dialog so homepage "£25" / footer copy do not break strict mode
    const dialog = page.getByRole("dialog", { name: /tradeScore assistant/i });
    // User bubbles use li.justify-end; assistant uses li.justify-start (see AIChatBox)
    const assistantBubbles = dialog.locator("li.justify-start p.whitespace-pre-wrap");
    await expect(assistantBubbles.last()).toBeVisible({ timeout: 25_000 });
    await expect(assistantBubbles.last()).toContainText(/\S/);
    await expect(dialog.locator('[role="alert"]')).toHaveCount(0);
  });
});
