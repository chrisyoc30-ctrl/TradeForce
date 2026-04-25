# CURSOR DELEGATION PROMPT - HIGH PRIORITY ISSUES
## TradeScore Platform - Chat & Payments Integration

**Priority Level:** 🟠 HIGH  
**Estimated Time:** 4-5 hours  
**Success Criteria:** Chat router functional, payments router functional, Stripe webhook working

---

## ROLE & OBJECTIVE

You are a senior full-stack engineer implementing two critical business features:

1. **Chat Router** - Real-time messaging between homeowners and tradesmen with LLM-powered responses
2. **Payments Router** - Stripe integration for lead acceptance payments

Your job is to:
- Implement tRPC procedures for chat and payments
- Integrate with Stripe for payment processing
- Set up webhook handling for payment events
- Ensure security and error handling
- Test end-to-end flows

---

## CONTEXT & CONSTRAINTS

**Stack:** React 19, tRPC 11, TanStack Query, Stripe, OpenAI-compatible LLM

**Project Structure:**
```
server/
├── routers.ts          ← Add chat and payments procedures here
├── db.ts               ← Add chat/payment query helpers
├── emails/             ← Email templates already copied
└── _core/
    ├── llm.ts          ← LLM integration (already configured)
    └── notification.ts ← Owner notifications
```

**Database Schema (Drizzle):**
```typescript
// Already in drizzle/schema.ts - use these tables:
- users (id, email, name, role, stripe_customer_id)
- leads (id, homeowner_id, title, description, budget, status)
- chats (id, lead_id, sender_id, message, created_at)
- payments (id, lead_id, amount, stripe_intent_id, status)
```

**Environment Variables Available:**
```
STRIPE_SECRET_KEY          ← Server-side only
STRIPE_PUBLISHABLE_KEY     ← Client-side
STRIPE_WEBHOOK_SECRET      ← Webhook verification
OPENAI_API_KEY            ← LLM integration (via invokeLLM helper)
```

---

## HIGH PRIORITY ISSUE #1: CHAT ROUTER NOT INTEGRATED

### Problem
Chat functionality from Cursor's integration guide not implemented. Users can't communicate about leads.

### Solution: Implement Chat Router

#### Step 1: Add Chat Database Queries
**File:** `server/db.ts` (add these functions)

```typescript
import { db } from './db';
import { chats, leads } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Get chat history for a lead
 */
export async function getChatHistory(leadId: string) {
  return db
    .select()
    .from(chats)
    .where(eq(chats.leadId, leadId))
    .orderBy(desc(chats.createdAt))
    .limit(50);
}

/**
 * Create a new chat message
 */
export async function createChatMessage(
  leadId: string,
  senderId: string,
  message: string,
  isAI: boolean = false
) {
  return db.insert(chats).values({
    leadId,
    senderId,
    message,
    isAI,
    createdAt: new Date(),
  });
}

/**
 * Get lead details for context
 */
export async function getLeadDetails(leadId: string) {
  return db.query.leads.findFirst({
    where: eq(leads.id, leadId),
  });
}
```

#### Step 2: Add Chat tRPC Router
**File:** `server/routers.ts` (add this router)

```typescript
import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './trpc';
import { getChatHistory, createChatMessage, getLeadDetails } from './db';
import { invokeLLM } from './_core/llm';
import { TRPCError } from '@trpc/server';

/**
 * Chat Router - Handle messaging between homeowners and tradesmen
 */
const chatRouter = router({
  /**
   * Get chat history for a lead
   */
  getHistory: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ input }) => {
      try {
        const messages = await getChatHistory(input.leadId);
        return messages;
      } catch (error) {
        console.error('Error fetching chat history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch chat history',
        });
      }
    }),

  /**
   * Send a message and get AI response
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        message: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Save user message
        await createChatMessage(
          input.leadId,
          ctx.user.id.toString(),
          input.message,
          false
        );

        // 2. Get lead context for AI
        const lead = await getLeadDetails(input.leadId);
        if (!lead) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lead not found',
          });
        }

        // 3. Get chat history for context
        const history = await getChatHistory(input.leadId);

        // 4. Generate AI response
        const systemPrompt = `You are a helpful assistant for TradeScore, a platform connecting homeowners with tradesmen.
        
Lead Details:
- Title: ${lead.title}
- Description: ${lead.description}
- Budget: £${lead.budget}
- Status: ${lead.status}

Be professional, helpful, and concise. Ask clarifying questions if needed. Never make promises about pricing or timelines.`;

        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...history.map(msg => ({
            role: msg.isAI ? ('assistant' as const) : ('user' as const),
            content: msg.message,
          })),
          { role: 'user' as const, content: input.message },
        ];

        const response = await invokeLLM({
          messages,
        });

        const aiMessage =
          response.choices[0]?.message?.content || 'Unable to generate response';

        // 5. Save AI response
        await createChatMessage(
          input.leadId,
          'ai-assistant', // Special ID for AI
          aiMessage,
          true
        );

        return {
          userMessage: input.message,
          aiMessage,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error('Error sending message:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send message',
        });
      }
    }),

  /**
   * Mark chat as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .mutation(async ({ input }) => {
      // TODO: Implement read status tracking
      return { success: true };
    }),
});

// Export in main router
export const appRouter = router({
  chat: chatRouter,
  // ... other routers
});
```

#### Step 3: Create Chat UI Component
**File:** `client/src/components/ChatBox.tsx`

```typescript
import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';

interface ChatBoxProps {
  leadId: string;
}

export function ChatBox({ leadId }: ChatBoxProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history
  const { data: messages = [] } = trpc.chat.getHistory.useQuery({ leadId });

  // Send message mutation
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage('');
      // Refetch history
      trpc.useUtils().chat.getHistory.invalidate({ leadId });
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      await sendMessageMutation.mutateAsync({
        leadId,
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-96 bg-card border-white/10">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.isAI ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.isAI
                    ? 'bg-zinc-800 text-foreground'
                    : 'bg-[#FF6B35] text-white'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4 flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          disabled={isLoading}
          className="bg-zinc-900 border-white/20 text-foreground placeholder:text-muted-foreground"
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          className="bg-[#FF6B35] hover:bg-[#e85f2d] text-white"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </Card>
  );
}
```

---

## HIGH PRIORITY ISSUE #2: PAYMENTS ROUTER NOT INTEGRATED

### Problem
Stripe payments router and webhook not implemented. Users can't pay for leads.

### Solution: Implement Payments Router

#### Step 1: Add Payments Database Queries
**File:** `server/db.ts` (add these functions)

```typescript
/**
 * Create a payment record
 */
export async function createPayment(
  leadId: string,
  amount: number,
  stripeIntentId: string,
  status: 'pending' | 'succeeded' | 'failed'
) {
  return db.insert(payments).values({
    leadId,
    amount,
    stripeIntentId,
    status,
    createdAt: new Date(),
  });
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  stripeIntentId: string,
  status: 'succeeded' | 'failed'
) {
  return db
    .update(payments)
    .set({ status, updatedAt: new Date() })
    .where(eq(payments.stripeIntentId, stripeIntentId));
}

/**
 * Get payment by Stripe intent ID
 */
export async function getPaymentByIntentId(stripeIntentId: string) {
  return db.query.payments.findFirst({
    where: eq(payments.stripeIntentId, stripeIntentId),
  });
}

/**
 * Get user's Stripe customer ID or create one
 */
export async function getOrCreateStripeCustomer(userId: string, email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new customer in Stripe
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const customer = await stripe.customers.create({
    email,
    metadata: { userId: userId.toString() },
  });

  // Save to database
  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));

  return customer.id;
}
```

#### Step 2: Add Payments tRPC Router
**File:** `server/routers.ts` (add this router)

```typescript
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Payments Router - Handle lead acceptance payments
 */
const paymentsRouter = router({
  /**
   * Create a payment intent for lead acceptance
   */
  createLeadAcceptanceIntent: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        amount: z.number().min(25).max(100000), // £25 minimum
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Get or create Stripe customer
        const customerId = await getOrCreateStripeCustomer(
          ctx.user.id,
          ctx.user.email
        );

        // 2. Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: input.amount * 100, // Convert to pence
          currency: 'gbp',
          customer: customerId,
          metadata: {
            leadId: input.leadId,
            userId: ctx.user.id.toString(),
            email: ctx.user.email,
          },
          description: `Lead acceptance payment - Lead ID: ${input.leadId}`,
        });

        // 3. Save payment record
        await createPayment(
          input.leadId,
          input.amount,
          paymentIntent.id,
          'pending'
        );

        return {
          clientSecret: paymentIntent.client_secret,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
          amount: input.amount,
          currency: 'gbp',
        };
      } catch (error) {
        console.error('Error creating payment intent:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create payment intent',
        });
      }
    }),

  /**
   * Get payment status
   */
  getPaymentStatus: protectedProcedure
    .input(z.object({ stripeIntentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const payment = await getPaymentByIntentId(input.stripeIntentId);
        return payment;
      } catch (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }
    }),

  /**
   * Get user's payment history
   */
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      return db
        .select()
        .from(payments)
        .where(eq(payments.userId, ctx.user.id))
        .orderBy(desc(payments.createdAt));
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch payment history',
      });
    }
  }),
});

// Export in main router
export const appRouter = router({
  payments: paymentsRouter,
  // ... other routers
});
```

#### Step 3: Create Stripe Webhook Handler
**File:** `server/_core/stripe-webhook.ts` (NEW FILE)

```typescript
import { Request, Response } from 'express';
import { Stripe } from 'stripe';
import { updatePaymentStatus } from '../db';
import { notifyOwner } from './notification';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log('[Webhook] Test event detected, returning verification response');
    return res.json({ verified: true });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);

        // Update payment status
        await updatePaymentStatus(paymentIntent.id, 'succeeded');

        // Notify owner
        await notifyOwner({
          title: '💰 Payment Received',
          content: `Lead acceptance payment of £${(paymentIntent.amount / 100).toFixed(2)} received from ${paymentIntent.metadata?.email}`,
        });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);

        // Update payment status
        await updatePaymentStatus(paymentIntent.id, 'failed');

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Charge refunded:', charge.id);

        // Handle refund logic here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
```

#### Step 4: Register Webhook in Express
**File:** `server/_core/index.ts` (add webhook route)

```typescript
import express from 'express';
import { handleStripeWebhook } from './stripe-webhook';

const app = express();

// IMPORTANT: Register raw webhook BEFORE express.json()
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Then register other middleware
app.use(express.json());

// ... rest of your routes
```

#### Step 5: Create Payment UI Component
**File:** `client/src/components/PaymentForm.tsx`

```typescript
import { useState } from 'react';
import { loadStripe } from '@stripe/js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!
);

interface PaymentFormProps {
  leadId: string;
  amount: number;
  onSuccess?: () => void;
}

function PaymentFormContent({ leadId, amount, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const createIntentMutation = trpc.payments.createLeadAcceptanceIntent.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    try {
      // 1. Create payment intent
      const { clientSecret } = await createIntentMutation.mutateAsync({
        leadId,
        amount,
      });

      // 2. Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        alert(`Payment failed: ${result.error.message}`);
      } else if (result.paymentIntent?.status === 'succeeded') {
        alert('Payment successful!');
        onSuccess?.();
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-white/10">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Card Details
          </label>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
            className="p-3 border border-white/20 rounded-md bg-zinc-900"
          />
        </div>

        <div className="p-4 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-lg">
          <p className="text-sm text-foreground">
            Amount: <span className="font-semibold">£{amount.toFixed(2)}</span>
          </p>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !stripe}
          className="w-full bg-[#FF6B35] hover:bg-[#e85f2d] text-white font-semibold py-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay £${amount.toFixed(2)}`
          )}
        </Button>
      </form>
    </Card>
  );
}

export function PaymentForm({ leadId, amount, onSuccess }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent leadId={leadId} amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}
```

---

## INTEGRATION CHECKLIST

### Before Implementing
- [ ] Read Stripe documentation: https://stripe.com/docs/payments
- [ ] Review LLM integration: `server/_core/llm.ts`
- [ ] Understand tRPC patterns in existing `server/routers.ts`

### During Implementation
- [ ] Install Stripe: `pnpm add stripe @stripe/react-stripe-js`
- [ ] Add Stripe webhook URL to Stripe dashboard
- [ ] Test with Stripe test keys (4242 4242 4242 4242)
- [ ] Verify webhook signature verification works
- [ ] Test error handling (failed payments, network errors)

### After Implementation
- [ ] Run `pnpm test` to verify no regressions
- [ ] Test chat flow end-to-end
- [ ] Test payment flow end-to-end
- [ ] Verify Stripe webhook delivery
- [ ] Check error messages are user-friendly
- [ ] Verify no sensitive data in logs

---

## SUCCESS CRITERIA

✅ Chat messages save to database  
✅ AI responses generated via LLM  
✅ Chat history loads correctly  
✅ Payment intents created successfully  
✅ Stripe webhook processes payments  
✅ Payment status updates in database  
✅ Error handling for all failure cases  
✅ No console errors  
✅ All tRPC mutations working  

---

## TESTING COMMANDS

```bash
# Test chat router
curl -X POST http://localhost:3000/api/trpc/chat.sendMessage \
  -H "Content-Type: application/json" \
  -d '{"leadId":"123","message":"Hello"}'

# Test payment intent creation
curl -X POST http://localhost:3000/api/trpc/payments.createLeadAcceptanceIntent \
  -H "Content-Type: application/json" \
  -d '{"leadId":"123","amount":25}'

# Test Stripe webhook (use Stripe CLI)
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger payment_intent.succeeded
```

---

## DELIVERABLES

1. ✅ Chat router with message sending
2. ✅ LLM integration for AI responses
3. ✅ Chat UI component
4. ✅ Payments router with intent creation
5. ✅ Stripe webhook handler
6. ✅ Payment UI component
7. ✅ Error handling for all flows
8. ✅ Database queries for persistence

---

## NEXT STEPS

After completing this:
1. Move to MEDIUM PRIORITY: Email template wiring
2. Move to MEDIUM PRIORITY: Form validation
3. Run comprehensive testing

**Estimated Total Time:** 4-5 hours  
**Complexity:** High  
**Risk Level:** Medium (external API integration)

---

## SIGN-OFF

**Prepared By:** Manus AI Agent  
**Date:** 2026-04-24  
**Status:** Ready for Cursor implementation  
**Confidence Level:** High (detailed code examples provided)
