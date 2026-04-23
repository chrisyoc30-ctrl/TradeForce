import { describe, expect, it } from "vitest";

import {
  countRepeatedUserQuestion,
  detectFrustration,
  matchRuleEscalation,
  shouldEscalateFromRules,
} from "./chat-escalation";

describe("matchRuleEscalation", () => {
  it("escalates refund language", () => {
    const r = matchRuleEscalation("I want a refund on my last lead fee");
    expect(r.escalate).toBe(true);
    expect(r.reason).toBe("refund_request");
  });

  it("escalates human agent request", () => {
    const r = matchRuleEscalation("Can I speak to a human please");
    expect(r.escalate).toBe(true);
    expect(r.reason).toBe("human_agent");
  });

  it("does not escalate generic how-it-works", () => {
    const r = matchRuleEscalation("How does lead scoring work?");
    expect(r.escalate).toBe(false);
  });
});

describe("countRepeatedUserQuestion", () => {
  it("counts identical prior user questions", () => {
    const history = [
      { role: "user" as const, content: "How much is a lead?" },
      { role: "assistant" as const, content: "£25..." },
      { role: "user" as const, content: "How much is a lead?" },
    ];
    expect(countRepeatedUserQuestion(history, "How much is a lead?")).toBe(2);
  });
});

describe("shouldEscalateFromRules", () => {
  it("escalates on third similar ask", () => {
    const history = [
      { role: "user" as const, content: "What is the price for trades?" },
      { role: "assistant" as const, content: "£25 per lead..." },
      { role: "user" as const, content: "What is the price for trades?" },
    ];
    const r = shouldEscalateFromRules("What is the price for trades?", history);
    expect(r.escalate).toBe(true);
    expect(r.reason).toBe("repeated_question");
  });
});

describe("detectFrustration", () => {
  it("detects strong frustration phrases", () => {
    expect(detectFrustration("This is a joke!!!")).toBe(true);
  });
});
