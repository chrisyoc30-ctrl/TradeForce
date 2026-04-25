import { test as base, expect } from "@playwright/test";

/**
 * Hides the cookie bar so fixed UI (e.g. chat, bottom CTAs) is clickable in E2E.
 */
export const test = base.extend({
  page: async ({ page }, applyPage) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("cookie_consent", "declined");
      } catch {
        /* ignore */
      }
    });
    await applyPage(page);
  },
});

export { expect };
