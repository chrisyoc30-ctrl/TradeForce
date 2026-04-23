import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const server = setupServer(
  http.post("http://127.0.0.1:5000/api/leads", async () => {
    return HttpResponse.json({
      id: "test-lead-msw",
      aiGrade: "A",
      aiScore: 91,
      fraudRisk: "low",
      scoreBreakdown: { contactQuality: 80 },
    });
  }),
);

beforeAll(() =>
  server.listen({
    onUnhandledRequest: "bypass",
  }),
);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("leads.create (MSW)", () => {
  it("proxies to Flask URL and returns AI fields", async () => {
    const caller = appRouter.createCaller(await createTRPCContext());
    const res = await caller.leads.create({
      name: "Alex",
      phone: "07123456789",
      projectType: "Electrical",
      description: "New sockets",
    });
    expect(res.id).toBe("test-lead-msw");
    expect(res.aiGrade).toBe("A");
    expect(res.aiScore).toBe(91);
  });
});
