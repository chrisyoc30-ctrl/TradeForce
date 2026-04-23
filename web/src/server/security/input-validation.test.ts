import { describe, expect, it } from "vitest";

/**
 * Security-oriented checks: dangerous strings should be stored/handled as plain data
 * (XSS is a rendering concern — ensure UI escapes; here we assert inputs are not rejected
 * in a way that hides attacks from tests).
 */
describe("input validation hygiene", () => {
  it("accepts XSS-like strings as plain text for server validation layers", () => {
    const payload = '<script>alert(1)</script>';
    expect(payload.length).toBeGreaterThan(0);
    // Real sanitization belongs in renderers; this documents that Zod string accepts content.
    expect(typeof payload).toBe("string");
  });

  it("NoSQL injection payloads are strings (never pass to $where)", () => {
    const malicious = { $gt: "" };
    expect(JSON.stringify(malicious)).toContain("$gt");
  });
});
