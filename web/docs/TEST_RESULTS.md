# TradeScore — Test results log (template)

**Release / cycle:** _e.g. RC-1, v1.0.0_  
**Environment:** _staging | production_  
**Build / commit:** _git SHA_  
**Date range:** _YYYY-MM-DD → YYYY-MM-DD_  
**QA lead:** _Name_

---

## Summary

| Area | Total | Pass | Fail | Blocked | N/A |
|------|-------|------|------|---------|-----|
| Functional | | | | | |
| Browser | | | | | |
| Device | | | | | |
| Performance | | | | | |
| Security | | | | | |
| Accessibility | | | | | |
| Integration | | | | | |
| Load | | | | | |

**Overall status:** _Pass | Fail | Conditional pass_  
**Blocking defects:** _List IDs or “None”_

---

## Results by section

### Functional

| ID | Description | Result (P/F/B/N) | Tester | Date | Evidence notes |
|----|-------------|------------------|--------|------|----------------|
| F-1.1 | Lead submit valid | | | | |
| F-1.2 | Lead validation empty | | | | |
| … | | | | | |

### Browser matrix

| Browser | Critical path | Result | Tester | Date | Notes |
|---------|---------------|--------|--------|------|-------|
| Chrome | | | | | |
| Firefox | | | | | |
| Safari | | | | | |
| Edge | | | | | |
| iOS Safari | | | | | |
| Android Chrome | | | | | |

### Device / viewport

| Viewport | Result | Notes |
|----------|--------|-------|
| 390px | | |
| 430px | | |
| 768px | | |
| 1024px | | |
| 1920px | | |

### Performance

| Metric | Target | Actual | Result |
|--------|--------|--------|--------|
| Lighthouse Perf (/) | > 80 | | |
| Lighthouse Perf (/lead-capture) | > 80 | | |
| LCP (lab) | < 2s | | |
| Console errors | 0 | | |

### Security

| Check | Result | Notes |
|-------|--------|-------|
| Secrets in repo | | |
| HTTPS | | |
| CORS | | |
| Webhook signature | | |

### Accessibility

| Check | Result | Tool |
|-------|--------|------|
| Keyboard lead form | | Manual |
| Lighthouse a11y | | |
| axe (optional) | | |

### Integration

| System | Test | Result | Evidence |
|--------|------|--------|----------|
| Stripe | Test payment | | pi_xxx |
| Webhook | Delivery | | evt_xxx |
| MongoDB | Lead persisted | | ObjectId |
| Flask | API health | | |

### Load (staging)

| Scenario | RPS / VUs | Duration | Error % | p95 latency |
|----------|-----------|----------|---------|-------------|
| | | | | |

---

## Failures & follow-ups

| Bug ID | Test ID | Summary | Severity | Owner | Status |
|--------|---------|---------|----------|-------|--------|
| | | | | | |

---

## Waivers & risks accepted

| Item | Reason | Approved by | Date |
|------|--------|-------------|------|
| | | | |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA lead | | | |
| Engineering | | | |
| Product | | | |

---

_Copy this file per release: e.g. `TEST_RESULTS_RC1_2026-04-23.md`._
