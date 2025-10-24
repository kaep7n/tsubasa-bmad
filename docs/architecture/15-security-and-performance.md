# 15. Security and Performance

## Security Requirements

**Frontend Security:**
- CSP headers configured
- Angular's built-in XSS protection
- JWT tokens in memory only

**Backend Security:**
- Database constraints validation
- Supabase rate limiting (100 req/s)
- RLS policies for data isolation

**Authentication Security:**
- 1-hour access tokens with refresh
- Bcrypt password hashing
- Email-based password reset

## Performance Optimization

**Frontend Performance:**
- Bundle size < 250KB (initial)
- Lazy loading all features
- Service Worker caching
- OnPush change detection

**Backend Performance:**
- Response time < 200ms (p95)
- Indexed foreign keys
- Connection pooling
- Query optimization

---
