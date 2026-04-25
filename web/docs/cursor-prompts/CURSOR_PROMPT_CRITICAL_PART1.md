# CURSOR DELEGATION PROMPT - CRITICAL ISSUES (PART 1/2)
## TradeScore Platform - Pages & Routing Implementation

**Priority Level:** 🔴 CRITICAL  
**Estimated Time:** 1.5-2 hours  
**Success Criteria:** All 4 pages created, routing working, no console errors

---

## ROLE & OBJECTIVE

You are implementing 4 critical missing pages for the TradeScore platform. Your job is to:

1. Create `/lead-capture` page (homeowner form)
2. Create `/tradesman-signup` page (tradesman registration)
3. Create `/lead-scoring` page (browse leads)
4. Create `/available-jobs` page (job listings)
5. Update `App.tsx` with all routes
6. Ensure no console errors

---

## CONTEXT

**Stack:** React 19, Wouter routing, Tailwind CSS 4, shadcn/ui  
**Design:** Dark theme, orange accent (#FF6B35)  
**Branding:** TradeScore - connecting homeowners with tradesmen

---

## CRITICAL ISSUE #1: MISSING ROUTE IMPLEMENTATIONS

### Problem
Navigation links point to routes that don't exist.

### Solution: Create Missing Pages

#### Step 1: Create `/lead-capture` Page
**File:** `client/src/pages/LeadCapture.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function LeadCapture() {
  const [navigate] = useNavigate();
  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    budget: '',
    timeline: '',
    location: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Lead submitted:', formData);
      alert('Project submitted successfully! Tradesmen will see your project shortly.');
      navigate('/homeowner-dashboard');
    } catch (error) {
      console.error('Error submitting lead:', error);
      alert('Failed to submit project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Post Your Project</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8 bg-card border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title */}
            <div>
              <Label htmlFor="projectTitle" className="text-foreground">
                Project Title *
              </Label>
              <Input
                id="projectTitle"
                name="projectTitle"
                type="text"
                placeholder="e.g., Kitchen Renovation"
                value={formData.projectTitle}
                onChange={handleChange}
                required
                className="mt-2 bg-zinc-900 border-white/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-foreground">
                Project Description *
              </Label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe your project in detail..."
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                className="mt-2 w-full px-3 py-2 bg-zinc-900 border border-white/20 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
              />
            </div>

            {/* Budget */}
            <div>
              <Label htmlFor="budget" className="text-foreground">
                Budget (£) *
              </Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                placeholder="e.g., 5000"
                value={formData.budget}
                onChange={handleChange}
                required
                className="mt-2 bg-zinc-900 border-white/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Timeline */}
            <div>
              <Label htmlFor="timeline" className="text-foreground">
                Timeline *
              </Label>
              <select
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                required
                className="mt-2 w-full px-3 py-2 bg-zinc-900 border border-white/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
              >
                <option value="">Select timeline...</option>
                <option value="urgent">Urgent (This week)</option>
                <option value="soon">Soon (1-2 weeks)</option>
                <option value="flexible">Flexible (1-3 months)</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location" className="text-foreground">
                Location *
              </Label>
              <Input
                id="location"
                name="location"
                type="text"
                placeholder="e.g., City Centre"
                value={formData.location}
                onChange={handleChange}
                required
                className="mt-2 bg-zinc-900 border-white/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#FF6B35] hover:bg-[#e85f2d] text-white font-semibold py-3"
              >
                {isSubmitting ? 'Submitting...' : 'Post Project'}
              </Button>
              <Button
                type="button"
                onClick={() => navigate('/homeowner-dashboard')}
                variant="outline"
                className="flex-1 border-white/20 text-foreground hover:bg-white/5"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
```

#### Step 2: Create `/tradesman-signup` Page
**File:** `client/src/pages/TradesmanSignup.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function TradesmanSignup() {
  const [navigate] = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    tradeType: '',
    experience: '',
    serviceArea: '',
    phone: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Tradesman signup:', formData);
      alert('Registration successful! You\'ll receive a confirmation email shortly.');
      navigate('/tradesman-dashboard');
    } catch (error) {
      console.error('Error registering:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Join TradeScore</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '✓', text: '1 Month FREE' },
            { icon: '✓', text: 'No Upfront Fees' },
            { icon: '✓', text: '10% Commission' },
          ].map((benefit, idx) => (
            <Card key={idx} className="p-4 bg-card border-white/10 text-center">
              <div className="text-2xl mb-2">{benefit.icon}</div>
              <p className="text-sm text-foreground">{benefit.text}</p>
            </Card>
          ))}
        </div>

        <Card className="p-8 bg-card border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <Label htmlFor="businessName" className="text-foreground">
                Business Name *
              </Label>
              <Input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="e.g., John's Plumbing"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="mt-2 bg-zinc-900 border-white/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Trade Type */}
            <div>
              <Label htmlFor="tradeType" className="text-foreground">
                Trade Type *
              </Label>
              <select
                id="tradeType"
                name="tradeType"
                value={formData.tradeType}
                onChange={handleChange}
                required
                className="mt-2 w-full px-3 py-2 bg-zinc-900 border border-white/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
              >
                <option value="">Select trade...</option>
                <option value="plumber">Plumber</option>
                <option value="electrician">Electrician</option>
                <option value="carpenter">Carpenter</option>
                <option value="painter">Painter</option>
                <option value="roofer">Roofer</option>
                <option value="builder">Builder</option>
              </select>
            </div>

            {/* Experience */}
            <div>
              <Label htmlFor="experience" className="text-foreground">
                Years of Experience *
              </Label>
              <Input
                id="experience"
                name="experience"
                type="number"
                placeholder="e.g., 10"
                value={formData.experience}
                onChange={handleChange}
                required
                className="mt-2 bg-zinc-900 border-white/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Service Area */}
            <div>
              <Label htmlFor="serviceArea" className="text-foreground">
                Service Area *
              </Label>
              <Input
                id="serviceArea"
                name="serviceArea"
                type="text"
                placeholder="e.g., Glasgow City Centre"
                value={formData.serviceArea}
                onChange={handleChange}
                required
                className="mt-2 bg-zinc-900 border-white/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-foreground">
                Phone Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g., 07700 900000"
                value={formData.phone}
                onChange={handleChange}
                required
                className="mt-2 bg-zinc-900 border-white/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-foreground">
                About Your Business
              </Label>
              <textarea
                id="description"
                name="description"
                placeholder="Tell us about your business..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full px-3 py-2 bg-zinc-900 border border-white/20 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#FF6B35] hover:bg-[#e85f2d] text-white font-semibold py-3"
              >
                {isSubmitting ? 'Registering...' : 'Start Free Trial'}
              </Button>
              <Button
                type="button"
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1 border-white/20 text-foreground hover:bg-white/5"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
```

#### Step 3: Create `/lead-scoring` Page
**File:** `client/src/pages/LeadScoring.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MapPin, Pound, Clock } from 'lucide-react';
import { Link } from 'wouter';

interface Lead {
  id: string;
  title: string;
  description: string;
  budget: number;
  timeline: string;
  location: string;
  score: string;
  scoreColor: string;
}

const mockLeads: Lead[] = [
  {
    id: '1',
    title: 'Kitchen Renovation',
    description: 'Complete kitchen refit including new appliances and flooring',
    budget: 8000,
    timeline: 'urgent',
    location: 'West End',
    score: 'A',
    scoreColor: 'bg-green-500',
  },
  {
    id: '2',
    title: 'Bathroom Tiles',
    description: 'Retile bathroom walls and floor',
    budget: 2500,
    timeline: 'soon',
    location: 'City Centre',
    score: 'B',
    scoreColor: 'bg-blue-500',
  },
  {
    id: '3',
    title: 'Roof Repair',
    description: 'Fix leaking roof and replace damaged tiles',
    budget: 5000,
    timeline: 'urgent',
    location: 'South Side',
    score: 'A',
    scoreColor: 'bg-green-500',
  },
];

export default function LeadScoring() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const getTimelineLabel = (timeline: string) => {
    const labels: Record<string, string> = {
      urgent: 'This week',
      soon: '1-2 weeks',
      flexible: '1-3 months',
    };
    return labels[timeline] || timeline;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Available Leads</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['all', 'A', 'B', 'C'].map(filter => (
            <Button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              className={selectedFilter === filter ? 'bg-[#FF6B35] text-white' : 'border-white/20 text-foreground'}
            >
              {filter === 'all' ? 'All Leads' : `Grade ${filter}`}
            </Button>
          ))}
        </div>

        {/* Leads Grid */}
        <div className="grid gap-6">
          {mockLeads.map(lead => (
            <Card key={lead.id} className="p-6 bg-card border-white/10 hover:border-[#FF6B35]/50 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{lead.title}</h3>
                  <p className="text-muted-foreground mb-4">{lead.description}</p>
                </div>
                <div className={`${lead.scoreColor} text-white font-bold text-3xl w-16 h-16 rounded-lg flex items-center justify-center ml-4`}>
                  {lead.score}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Pound className="w-5 h-5 text-[#FF6B35]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-semibold text-foreground">£{lead.budget.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#FF6B35]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Timeline</p>
                    <p className="font-semibold text-foreground">{getTimelineLabel(lead.timeline)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#FF6B35]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-semibold text-foreground">{lead.location}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-[#FF6B35] hover:bg-[#e85f2d] text-white">
                  Send Quote
                </Button>
                <Button variant="outline" className="flex-1 border-white/20 text-foreground hover:bg-white/5">
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### Step 4: Create `/available-jobs` Page
**File:** `client/src/pages/AvailableJobs.tsx`

```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { Link } from 'wouter';

export default function AvailableJobs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Available Jobs</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Card className="p-12 bg-card border-white/10 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Coming Soon</h2>
          <p className="text-muted-foreground mb-6">
            This feature is currently in development. Check back soon for available job listings.
          </p>
          <Link href="/">
            <Button className="bg-[#FF6B35] hover:bg-[#e85f2d] text-white">
              Go Back Home
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
```

#### Step 5: Update `App.tsx` with All Routes
**File:** `client/src/App.tsx` (update existing file)

```typescript
import { Route, Switch } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { ThemeProvider } from '@/components/theme-provider';

// Pages
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import HomeownerDashboard from '@/pages/HomeownerDashboard';
import LeadCapture from '@/pages/LeadCapture';
import TradesmanSignup from '@/pages/TradesmanSignup';
import LeadScoring from '@/pages/LeadScoring';
import AvailableJobs from '@/pages/AvailableJobs';

export default function App() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/lead-capture" component={LeadCapture} />
        <Route path="/tradesman-signup" component={TradesmanSignup} />
        <Route path="/lead-scoring" component={LeadScoring} />
        <Route path="/available-jobs" component={AvailableJobs} />

        {/* Protected Routes */}
        {isAuthenticated && (
          <>
            <Route path="/homeowner-dashboard" component={HomeownerDashboard} />
          </>
        )}

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </ThemeProvider>
  );
}
```

---

## INTEGRATION CHECKLIST

### Before Implementing
- [ ] Read all 4 page implementations above
- [ ] Understand Wouter routing (it's similar to React Router)
- [ ] Check existing pages for patterns

### During Implementation
- [ ] Create all 4 page files
- [ ] Update App.tsx with routes
- [ ] Import all components correctly
- [ ] Use consistent styling (dark theme, orange accent)

### After Implementation
- [ ] Test all 4 pages load without errors
- [ ] Click all navigation links
- [ ] Check responsive design (mobile/tablet/desktop)
- [ ] Verify no console errors
- [ ] Test form inputs (they don't need to submit yet)

---

## SUCCESS CRITERIA

✅ All 4 pages created  
✅ All routes in App.tsx  
✅ Navigation working between pages  
✅ No console errors  
✅ Responsive design verified  
✅ Forms display correctly  
✅ All buttons clickable  

---

## NEXT STEP

After completing this Part 1, move to **CURSOR_PROMPT_CRITICAL_PART2.md** to:
- Fix any remaining navigation issues
- Add missing components
- Ensure everything is polished

---

## SIGN-OFF

**Prepared By:** Manus AI Agent  
**Date:** 2026-04-24  
**Status:** Ready for Cursor implementation  
**Confidence Level:** Very High
