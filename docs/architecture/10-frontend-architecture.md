# 10. Frontend Architecture

## Component Architecture
```text
src/app/
├── core/                    # Singleton services & guards
├── shared/                  # Reusable components
├── features/                # Feature modules (lazy loaded)
│   ├── auth/
│   ├── dashboard/
│   ├── players/
│   ├── training/
│   ├── games/
│   ├── live-game/
│   └── stats/
└── layouts/                 # Layout components
```

## State Management
- Signals for synchronous local state
- RxJS for async operations and service communication
- Service-based state management (no NgRx needed for single-user app)

## Routing Architecture
- Lazy-loaded feature modules
- Protected routes with functional guards
- Prevent accidental game exit with canDeactivate

---
