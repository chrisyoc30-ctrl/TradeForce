import { describe, expect, it } from "vitest";

import { isLeadFormSubmittable } from "./lead-form-submittable";

describe("isLeadFormSubmittable", () => {
  it("false when required fields empty", () => {
    expect(
      isLeadFormSubmittable({
        name: "",
        phone: "1",
        projectType: "x",
        location: "G1",
        description: "y",
      }),
    ).toBe(false);
  });

  it("true when all required trimmed non-empty", () => {
    expect(
      isLeadFormSubmittable({
        name: "Alex",
        phone: "07123456789",
        projectType: "Plumbing",
        location: "G1 1AA",
        description: "Leak under sink",
      }),
    ).toBe(true);
  });

  it("false when only whitespace in description", () => {
    expect(
      isLeadFormSubmittable({
        name: "Alex",
        phone: "07123456789",
        projectType: "Plumbing",
        location: "G1",
        description: "   ",
      }),
    ).toBe(false);
  });
});
