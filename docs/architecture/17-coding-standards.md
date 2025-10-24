# 17. Coding Standards

## Critical Rules
- **Type Sharing:** Define types in core/models, never duplicate
- **API Calls:** Always use service layer, never direct HTTP
- **State Updates:** Use Signals .update() or .set()
- **Offline Queue:** All mutations through OfflineSyncService
- **Auth Checks:** Use RLS policies, not application code

## Naming Conventions
- Components: PascalCase
- Services: PascalCase + "Service"
- Database: snake_case
- API Routes: kebab-case
- Constants: UPPER_SNAKE_CASE

---
