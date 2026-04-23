# Nine launch tasks — codebase map

This file ties the nine launch workstreams to concrete paths in the repo (completed as of the commit that references it).

1. **Homepage** — `web/src/app/page.tsx`, `web/src/components/homepage/*`, `web/src/components/homepage/structured-data.tsx`, `web/src/app/sitemap.ts`, `web/src/app/robots.ts`
2. **FAQ** — `web/src/app/faq/page.tsx`, `web/src/components/faq/*`
3. **Terms** — `web/src/app/terms/page.tsx`, `web/public/terms-of-service.md`
4. **Privacy** — `web/src/app/privacy/page.tsx`, `web/public/privacy-policy.md`
5. **Email** — `web/src/emails/*`, `web/docs/EMAIL_SETUP.md`, `web/scripts/verify-email-templates.tsx`, `npm run emails:verify`
6. **Social** — `web/docs/SOCIAL_MEDIA_POSTS.md`, `web/src/components/homepage/social-proof.tsx`
7. **Onboarding** — `web/docs/ONBOARDING_SEQUENCE.md`, `web/src/emails/onboarding/*`
8. **Monitoring** — `web/docs/MONITORING_CHECKLIST.md`, `web/docs/MONITORING_SETUP.md`, `web/docs/INCIDENT_RESPONSE.md`, `web/src/app/api/health/route.ts`
9. **Testing** — `web/docs/TESTING_CHECKLIST.md`, `web/docs/TEST_AUTOMATION.md`, `web/vitest.config.ts`, `web/e2e/*`, `.github/workflows/web-ci.yml`
