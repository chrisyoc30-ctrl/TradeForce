import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const createIntent = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    id: "pi_test_123",
    client_secret: "secret_test_456",
  }),
);

vi.mock("@/lib/stripe-server", () => ({
  getStripe: () => ({
    paymentIntents: { create: createIntent },
  }),
}));

describe("payments.createLeadAcceptanceIntent", () => {
  const prev = {
    sk: process.env.STRIPE_SECRET_KEY,
    pk: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  };

  beforeEach(() => {
    createIntent.mockClear();
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_dummy";
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("/api/leads/lead-abc")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              id: "lead-abc",
              name: "Pat Home",
              projectType: "Bathroom",
              email: "pat@example.com",
              description: "Retile and replace suite",
            }),
        } as Response);
      }
      return Promise.reject(new Error(`Unexpected fetch: ${String(url)}`));
    });
  });

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = prev.sk;
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = prev.pk;
  });

  it("returns client secret and charges £25 in pence", async () => {
    const caller = appRouter.createCaller(await createTRPCContext());
    const out = await caller.payments.createLeadAcceptanceIntent({
      leadId: "lead-abc",
      tradesmanEmail: "trader@example.com",
      tradesmanName: "Jamie Smith",
    });
    expect(out.clientSecret).toBe("secret_test_456");
    expect(out.amountPence).toBe(2500);
    expect(out.currency).toBe("gbp");
    expect(createIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2500,
        currency: "gbp",
        metadata: expect.objectContaining({
          leadId: "lead-abc",
          tradesmanEmail: "trader@example.com",
          tradesmanName: "Jamie Smith",
        }),
      }),
    );
  });
});
