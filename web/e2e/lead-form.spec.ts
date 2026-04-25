import { expect, test } from "./fixtures";

test.describe("homeowner lead form", () => {
  test("submit disabled until required fields filled", async ({ page }) => {
    await page.goto("/lead-capture");
    await expect(page.getByRole("heading", { name: /post a job/i })).toBeVisible();
    const submit = page.getByRole("button", { name: /submit job/i });
    await expect(submit).toBeDisabled();

    await page.locator("#name").fill("E2E User");
    await page.locator("#phone").fill("07123456789");
    await page.locator("#projectType").selectOption("Plumbing");
    await page.locator("#location").fill("G1 1AA");
    await page
      .locator("#description")
      .fill("Test leak repair under the kitchen sink, access available.");

    await expect(submit).toBeEnabled();
  });
});
