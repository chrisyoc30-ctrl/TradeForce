import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "./fixtures";

test.describe("accessibility (axe)", () => {
  test("homepage has no serious violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(
      serious,
      serious.map((v) => `${v.id}: ${v.help}`).join("\n"),
    ).toHaveLength(0);
  });

  test("lead capture page", async ({ page }) => {
    await page.goto("/lead-capture");
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious).toHaveLength(0);
  });
});
