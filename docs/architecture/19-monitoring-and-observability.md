# 19. Monitoring and Observability

## Monitoring Stack
- **Frontend:** Sentry + Web Vitals
- **Backend:** Supabase metrics
- **Errors:** Unified Sentry tracking
- **Performance:** Lighthouse CI

## Key Metrics

**Frontend:**
- Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- JavaScript error rate < 1%
- Offline sync success rate > 95%

**Backend:**
- Request rate and error rate
- Response time percentiles
- Database query performance
- RLS policy violations

## Alerting Rules
- High error rate (>5%) - Critical
- Slow API response (p95 > 1s) - Warning
- Sync failures (>10%) - Warning
- Low cache hit ratio (<90%) - Info

---
