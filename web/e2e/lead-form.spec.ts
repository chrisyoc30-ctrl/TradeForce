import { expect, test } from "@playwright/test";

test.describe("homeowner lead form", () => {
  test("submit disabled until required fields filled", async ({ page }) => {
    await page.goto("/lead-capture");
    await expect(page.getByRole("heading", { name: /post a job/i })).toBeVisible();
    const submit = page.getByRole("button", { name: /submit job/i });
    await expect(submit).toBeDisabled();

    await page.locator("#name").fill("E2E User");
    await page.locator("#phone").fill("07123456789");
    await page.locator("#projectType").fill("Plumbing");
    await page.locator("#description").fill("Test leak repair");

    await expect(submit).toBeEnabled();
  });
});
