# CURSOR DELEGATION PROMPT - MEDIUM PRIORITY ISSUES
## TradeScore Platform - Email, Validation & Error Handling

**Priority Level:** 🟡 MEDIUM  
**Estimated Time:** 3-4 hours  
**Success Criteria:** Email templates wired, form validation working, error handling complete

---

## ROLE & OBJECTIVE

You are a senior full-stack engineer implementing three important quality features:

1. **Email Template Wiring** - Connect email templates to tRPC procedures
2. **Form Validation** - Add Zod schemas and client-side validation
3. **Error Handling** - Implement error boundaries and user-friendly error messages

Your job is to:
- Wire email service to business events
- Implement comprehensive form validation
- Add error boundaries and fallbacks
- Ensure user-friendly error messages
- Test all error paths

---

## CONTEXT & CONSTRAINTS

**Stack:** React 19, tRPC 11, Zod validation, @react-email

**Email Templates Already Copied:**
```
server/emails/
├── render-email.ts       ← Email rendering utility
├── components/
│   ├── trade-score-layout.tsx
│   ├── onboarding-email.tsx
│   ├── payment-confirmation.tsx
│   └── support-email.tsx
└── constants.ts          ← Email branding constants
```

**Email Service Already Created:**
```
server/emails/email-service.ts  ← Use this to send emails
```

---

## MEDIUM PRIORITY ISSUE #1: EMAIL TEMPLATES NOT WIRED

### Problem
Email templates copied but not connected to business events (signup, payment, support).

### Solution: Wire Email Templates to tRPC

#### Step 1: Create Email Service Integration
**File:** `server/emails/email-service.ts` (update existing file)

```typescript
import { render } from '@react-email/render';
import OnboardingEmail from './components/onboarding-email';
import PaymentConfirmationEmail from './components/payment-confirmation';
import SupportEmail from './components/support-email';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send email via your email provider (SendGrid, Resend, etc.)
 * For now, just log to console
 */
async function sendEmail(options: SendEmailOptions) {
  console.log(`
    📧 Email sent to: ${options.to}
    Subject: ${options.subject}
    HTML: ${options.html.substring(0, 100)}...
  `);

  // TODO: Integrate with SendGrid/Resend
  // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     personalizations: [{ to: [{ email: options.to }] }],
  //     from: { email: 'support@tradescore.uk' },
  //     subject: options.subject,
  //     content: [
  //       { type: 'text/plain', value: options.text },
  //       { type: 'text/html', value: options.html },
  //     ],
  //   }),
  // });
  // return response.json();
}

/**
 * Send onboarding email to new user
 */
export async function sendOnboardingEmail(
  email: string,
  name: string,
  userType: 'homeowner' | 'tradesman'
) {
  const html = render(
    <OnboardingEmail name={name} userType={userType} />
  );
  const text = `Welcome to TradeScore, ${name}!`;

  return sendEmail({
    to: email,
    subject: `Welcome to TradeScore, ${name}!`,
    html,
    text,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  amount: number,
  leadTitle: string
) {
  const html = render(
    <PaymentConfirmationEmail amount={amount} leadTitle={leadTitle} />
  );
  const text = `Payment confirmed for ${leadTitle}: £${amount.toFixed(2)}`;

  return sendEmail({
    to: email,
    subject: `Payment Confirmed - £${amount.toFixed(2)}`,
    html,
    text,
  });
}

/**
 * Send support email to owner
 */
export async function sendSupportEmail(
  userEmail: string,
  userName: string,
  message: string
) {
  const html = render(
    <SupportEmail userName={userName} message={message} />
  );
  const text = `Support request from ${userName}: ${message}`;

  return sendEmail({
    to: 'support@tradescore.uk',
    subject: `Support Request from ${userName}`,
    html,
    text,
  });
}
```

#### Step 2: Add Email Procedures to tRPC
**File:** `server/routers.ts` (add to existing router)

```typescript
import {
  sendOnboardingEmail,
  sendPaymentConfirmationEmail,
  sendSupportEmail,
} from './emails/email-service';

/**
 * Email Router - Handle transactional emails
 */
const emailRouter = router({
  /**
   * Send onboarding email (called after signup)
   */
  sendOnboarding: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        userType: z.enum(['homeowner', 'tradesman']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await sendOnboardingEmail(input.email, input.name, input.userType);
        return { success: true };
      } catch (error) {
        console.error('Error sending onboarding email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send email',
        });
      }
    }),

  /**
   * Send payment confirmation email
   */
  sendPaymentConfirmation: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        amount: z.number(),
        leadTitle: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await sendPaymentConfirmationEmail(
          input.email,
          input.amount,
          input.leadTitle
        );
        return { success: true };
      } catch (error) {
        console.error('Error sending payment confirmation:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send email',
        });
      }
    }),

  /**
   * Send support email
   */
  sendSupport: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        message: z.string().min(10).max(1000),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await sendSupportEmail(input.email, input.name, input.message);
        return { success: true };
      } catch (error) {
        console.error('Error sending support email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send email',
        });
      }
    }),
});

// Export in main router
export const appRouter = router({
  email: emailRouter,
  // ... other routers
});
```

#### Step 3: Call Email Procedures from UI
**File:** `client/src/pages/TradesmanSignup.tsx` (update existing file)

```typescript
import { trpc } from '@/lib/trpc';

export default function TradesmanSignup() {
  const sendOnboardingEmail = trpc.email.sendOnboarding.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Register tradesman
      // const result = await trpc.tradesmen.register.mutate(formData);

      // Send onboarding email
      await sendOnboardingEmail.mutateAsync({
        email: formData.email,
        name: formData.businessName,
        userType: 'tradesman',
      });

      alert('Registration successful! Check your email for next steps.');
      navigate('/tradesman-dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... rest of component
}
```

---

## MEDIUM PRIORITY ISSUE #2: FORM VALIDATION NEEDED

### Problem
Forms lack validation. Users can submit invalid data. No clear error messages.

### Solution: Implement Zod Validation

#### Step 1: Create Validation Schemas
**File:** `shared/schemas.ts` (NEW FILE)

```typescript
import { z } from 'zod';

/**
 * Lead Capture Form Validation
 */
export const leadCaptureSchema = z.object({
  projectTitle: z
    .string()
    .min(5, 'Project title must be at least 5 characters')
    .max(100, 'Project title must be less than 100 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  budget: z
    .number()
    .min(100, 'Budget must be at least £100')
    .max(1000000, 'Budget must be less than £1,000,000'),
  timeline: z.enum(['urgent', 'soon', 'flexible']),
  location: z
    .string()
    .min(3, 'Location must be at least 3 characters')
    .max(100, 'Location must be less than 100 characters'),
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;

/**
 * Tradesman Signup Form Validation
 */
export const tradesmanSignupSchema = z.object({
  businessName: z
    .string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must be less than 100 characters'),
  tradeType: z.enum([
    'plumber',
    'electrician',
    'carpenter',
    'painter',
    'roofer',
    'builder',
    'other',
  ]),
  experience: z
    .number()
    .min(0, 'Experience must be 0 or more')
    .max(70, 'Experience must be less than 70 years'),
  serviceArea: z
    .string()
    .min(3, 'Service area must be at least 3 characters')
    .max(200, 'Service area must be less than 200 characters'),
  phone: z
    .string()
    .regex(/^[0-9\s\-\+\(\)]{10,}$/, 'Please enter a valid phone number'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
});

export type TradesmanSignupInput = z.infer<typeof tradesmanSignupSchema>;

/**
 * Chat Message Validation
 */
export const chatMessageSchema = z.object({
  leadId: z.string().uuid(),
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters'),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

/**
 * Support Email Validation
 */
export const supportEmailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
});

export type SupportEmailInput = z.infer<typeof supportEmailSchema>;
```

#### Step 2: Create Form Component with Validation
**File:** `client/src/components/FormField.tsx` (NEW FILE)

```typescript
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required,
  disabled,
}: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={name} className="text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`mt-2 bg-zinc-900 border-white/20 text-foreground placeholder:text-muted-foreground ${
          error ? 'border-red-500' : ''
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
```

#### Step 3: Update Lead Capture Form with Validation
**File:** `client/src/pages/LeadCapture.tsx` (update existing file)

```typescript
import { useState } from 'react';
import { leadCaptureSchema, type LeadCaptureInput } from '@shared/schemas';
import { ZodError } from 'zod';

export default function LeadCapture() {
  const [formData, setFormData] = useState<LeadCaptureInput>({
    projectTitle: '',
    description: '',
    budget: 0,
    timeline: 'flexible',
    location: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? parseFloat(value) : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate form data
      leadCaptureSchema.parse(formData);

      setIsSubmitting(true);

      // TODO: Call tRPC mutation to create lead
      console.log('Lead submitted:', formData);

      alert('Project submitted successfully!');
      // navigate('/homeowner-dashboard');
    } catch (error) {
      if (error instanceof ZodError) {
        // Set validation errors
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path[0] as string;
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      } else {
        alert('Failed to submit project. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ... existing JSX with FormField components
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Project Title"
        name="projectTitle"
        placeholder="e.g., Kitchen Renovation"
        value={formData.projectTitle}
        onChange={(value) => setFormData(prev => ({ ...prev, projectTitle: value }))}
        error={errors.projectTitle}
        required
      />
      {/* ... other fields */}
    </form>
  );
}
```

---

## MEDIUM PRIORITY ISSUE #3: ERROR HANDLING & BOUNDARIES

### Problem
No error boundaries. Unhandled errors crash the app. No fallback UI.

### Solution: Implement Error Boundaries

#### Step 1: Create Error Boundary Component
**File:** `client/src/components/ErrorBoundary.tsx` (NEW FILE)

```typescript
import { Component, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 flex items-center justify-center px-4">
            <Card className="p-8 bg-card border-white/10 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <h1 className="text-2xl font-bold text-foreground">
                  Something went wrong
                </h1>
              </div>

              <p className="text-muted-foreground mb-6">
                We encountered an unexpected error. Please try again.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-400 font-mono break-words">
                    {this.state.error?.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#e85f2d] text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="outline"
                  className="flex-1 border-white/20 text-foreground hover:bg-white/5"
                >
                  Go Home
                </Button>
              </div>
            </Card>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

#### Step 2: Wrap App with Error Boundary
**File:** `client/src/main.tsx` (update existing file)

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </ErrorBoundary>
);
```

#### Step 3: Create Error Notification Component
**File:** `client/src/components/ErrorNotification.tsx` (NEW FILE)

```typescript
import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorNotificationProps {
  message: string;
  onClose?: () => void;
  duration?: number;
}

export function ErrorNotification({
  message,
  onClose,
  duration = 5000,
}: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
      <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="ml-2 hover:opacity-70"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

#### Step 4: Add Global Error Handler
**File:** `client/src/lib/error-handler.ts` (NEW FILE)

```typescript
import { TRPCClientError } from '@trpc/client';

/**
 * Extract user-friendly error message from tRPC error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    return error.message || 'An error occurred. Please try again.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error for debugging
 */
export function logError(error: unknown, context?: string) {
  console.error(`[Error${context ? ` - ${context}` : ''}]`, error);

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
}

/**
 * Handle API errors with user-friendly messages
 */
export const errorMessages: Record<string, string> = {
  'UNAUTHORIZED': 'Please log in to continue.',
  'FORBIDDEN': 'You do not have permission to do this.',
  'NOT_FOUND': 'The requested resource was not found.',
  'BAD_REQUEST': 'Please check your input and try again.',
  'INTERNAL_SERVER_ERROR': 'Something went wrong on our end. Please try again.',
  'TIMEOUT': 'The request took too long. Please try again.',
  'NETWORK_ERROR': 'Please check your internet connection.',
};
```

---

## INTEGRATION CHECKLIST

### Before Implementing
- [ ] Review Zod documentation: https://zod.dev
- [ ] Review @react-email documentation
- [ ] Understand existing email templates

### During Implementation
- [ ] Create validation schemas
- [ ] Update all forms with validation
- [ ] Wire email procedures
- [ ] Add error boundaries
- [ ] Test all error paths

### After Implementation
- [ ] Test form validation with invalid data
- [ ] Test email sending (check console logs)
- [ ] Test error boundary by throwing error
- [ ] Verify error messages are user-friendly
- [ ] Test on mobile and desktop

---

## SUCCESS CRITERIA

✅ All forms have Zod validation  
✅ Validation errors display clearly  
✅ Email procedures callable from tRPC  
✅ Emails send on signup and payment  
✅ Error boundary catches crashes  
✅ Error messages are user-friendly  
✅ No console errors on happy path  
✅ All error paths tested  

---

## DELIVERABLES

1. ✅ Email service integration
2. ✅ Email tRPC procedures
3. ✅ Zod validation schemas
4. ✅ Form validation implementation
5. ✅ Error boundary component
6. ✅ Error notification component
7. ✅ Global error handler
8. ✅ Updated forms with validation

---

## NEXT STEPS

After completing this:
1. Run comprehensive end-to-end testing
2. Deploy to staging
3. Conduct user acceptance testing

**Estimated Total Time:** 3-4 hours  
**Complexity:** Medium  
**Risk Level:** Low (isolated feature addition)

---

## SIGN-OFF

**Prepared By:** Manus AI Agent  
**Date:** 2026-04-24  
**Status:** Ready for Cursor implementation  
**Confidence Level:** High (detailed code examples provided)
