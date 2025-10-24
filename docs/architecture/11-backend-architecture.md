# 11. Backend Architecture

Using Supabase Backend-as-a-Service:

## Database Functions
- Complex business logic in PostgreSQL functions
- Atomic operations (e.g., add_goal_with_assists)
- Bulk operations (e.g., bulk_update_attendance)
- Template-based generation (e.g., generate_training_sessions)

## Security Architecture
- Row Level Security (RLS) on all tables
- SECURITY DEFINER functions for controlled elevation
- auth.uid() ensures user context in all queries
- No application-level security logic needed

---
