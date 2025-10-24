# 12. Unified Project Structure

```plaintext
tsubasa/
├── .github/workflows/       # CI/CD
├── src/                     # Angular application
│   ├── app/
│   │   ├── core/           # Services, guards
│   │   ├── shared/         # Reusable components
│   │   └── features/       # Feature modules
│   ├── assets/             # PWA icons, manifest
│   ├── environments/       # Config per environment
│   └── styles/             # Global styles
├── supabase/               # Database migrations
│   └── migrations/
├── tests/                  # E2E tests
├── docs/                   # Documentation
└── package.json
```

---
