export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const homeownerFaqs: FaqItem[] = [
  {
    id: "h-how-works",
    question: "How does TradeScore work?",
    answer:
      "You describe your job in one place. Our AI scores and organises requests so serious, local trades see real projects—not tyre-kickers. You stay in control of who you speak to and when. Ready to start? Head to Post a job and tell us what you need.",
  },
  {
    id: "h-cost",
    question: "How much does it cost?",
    answer:
      "For homeowners, TradeScore is always free to submit a project. You don’t pay us to post or to get matched. Trades pay a flat fee when they accept a lead—your job pricing with the tradesperson is separate and agreed between you.",
  },
  {
    id: "h-verified",
    question: "How do I know tradesmen are verified?",
    answer:
      "We’re transparent: today’s product focuses on quality signals from the job brief and AI scoring, not a substitute for your own checks. Always ask for insurance, qualifications, and references before work starts. We’re building toward stronger verification over time.",
  },
  {
    id: "h-not-happy",
    question: "What if I'm not happy with the tradesman?",
    answer:
      "You choose who to hire—if someone doesn’t feel right, don’t proceed. For work already agreed, resolve issues directly with the tradesperson first; for payments made through a protected flow, follow the provider’s dispute process. We’re here to improve matching, not replace consumer rights.",
  },
  {
    id: "h-submit",
    question: "How do I submit a project?",
    answer:
      "Use Post a job, add a clear description, budget if you can, and timeline. The more detail you give, the better your match and score. It only takes a couple of minutes.",
  },
  {
    id: "h-after-submit",
    question: "What happens after I submit?",
    answer:
      "Your request is scored and surfaced to relevant trades. You’ll typically hear from pros who want the work—reply to the ones you like and compare quotes. Check your dashboard for updates if we’ve linked your job to an account view.",
  },
  {
    id: "h-multiple",
    question: "Can I contact multiple tradesmen?",
    answer:
      "Yes. You’re encouraged to compare a shortlist, ask the same questions, and pick the best fit on price and trust. There’s no obligation to hire the first person who replies.",
  },
  {
    id: "h-pay",
    question: "How do I pay?",
    answer:
      "You agree payment terms with your chosen tradesperson—bank transfer, invoice, or another method they offer. TradeScore’s fee is on the trade side for accepting a lead, not a cut of your invoice unless we offer a specific payment product in future.",
  },
  {
    id: "h-secure",
    question: "Is my information secure?",
    answer:
      "We only ask for what’s needed to describe the job and match trades. Don’t share passwords or bank details in the brief. Use secure channels when you’re ready to pay a tradesperson you trust.",
  },
  {
    id: "h-dispute",
    question: "What if I have a dispute?",
    answer:
      "Try to settle directly with the tradesperson first—most issues are misunderstandings on scope or timing. If money went through a card or platform, use their dispute tools. Keep records of quotes, messages, and agreements.",
  },
];

export const tradesmanFaqs: FaqItem[] = [
  {
    id: "t-how-works",
    question: "How does TradeScore work?",
    answer:
      "Leads land as scored jobs from homeowners. You review what fits your skills and patch, accept when you’re happy, then quote and win the work. The goal is fewer wasted visits and better-quality enquiries.",
  },
  {
    id: "t-cost",
    question: "How much does it cost?",
    answer:
      "You pay £25 per lead when you accept one—your first lead is free so you can try the service. There’s no monthly subscription and no commission on what you invoice the customer.",
  },
  {
    id: "t-included",
    question: "What's included in the £25?",
    answer:
      "You get access to that lead’s project details so you can decide if it’s worth quoting. It’s a flat introduction fee—not a percentage of the job. You keep 100% of what the homeowner pays you for the work.",
  },
  {
    id: "t-every-lead",
    question: "Do I have to pay for every lead?",
    answer:
      "You only pay when you accept a lead you want to pursue. Browse and ignore what doesn’t fit—no charge for looking. Your first accepted lead is free.",
  },
  {
    id: "t-dont-like",
    question: "What if I don't like a lead?",
    answer:
      "Don’t accept it. If you’ve already paid and the brief was materially wrong, contact support with specifics—we’ll look at it fairly. We want trades to trust what they’re buying.",
  },
  {
    id: "t-get-paid",
    question: "How do I get paid?",
    answer:
      "You invoice and collect from the homeowner the way you already run your business—bank transfer, card terminal, etc. TradeScore doesn’t take a slice of your job price.",
  },
  {
    id: "t-payment-time",
    question: "How long does payment take?",
    answer:
      "Lead fees are taken when you confirm payment in the app (e.g. via Stripe). Customer payments to you follow whatever terms you agree with them—typically on completion or staged for larger jobs.",
  },
  {
    id: "t-reject",
    question: "Can I reject leads?",
    answer:
      "Yes. Only accept jobs you actually want. That’s the point—less time on dead ends, more on profitable work.",
  },
  {
    id: "t-matched",
    question: "How are leads matched to me?",
    answer:
      "Matching uses the job type, location signals, urgency, and AI scoring so high-intent work surfaces first. We’re always improving relevance—tell us if something’s off.",
  },
  {
    id: "t-complaint",
    question: "What if a customer complains?",
    answer:
      "Handle it professionally: document scope, photos, and messages. Most complaints are scope or expectation gaps—clarify early, offer a fair fix, and use your insurance if needed. We’re not a court, but we may step in on platform abuse.",
  },
];
