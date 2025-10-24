# 13. Development Workflow

## Local Setup
```bash
# Prerequisites: Node 18+, Angular CLI 17, Supabase CLI

# Clone and install
git clone https://github.com/your-org/tsubasa.git
cd tsubasa
npm install

# Start Supabase locally
supabase start

# Run migrations
supabase db push

# Start dev server
npm start
```

## Key Commands
- `npm start` - Start frontend dev server
- `npm test` - Run unit tests
- `npm run e2e` - Run E2E tests
- `npm run build` - Production build
- `npm run supabase:types` - Generate TypeScript types

---
