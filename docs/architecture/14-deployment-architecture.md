# 14. Deployment Architecture

## Deployment Strategy
- **Frontend:** Cloudflare Pages (global CDN)
- **Backend:** Supabase Cloud (managed PostgreSQL)
- **CI/CD:** GitHub Actions for automated deployment

## Environments
| Environment | Frontend URL | Backend URL |
|------------|--------------|-------------|
| Development | http://localhost:4200 | http://localhost:54321 |
| Staging | https://staging.tsubasa.pages.dev | https://staging-project.supabase.co |
| Production | https://tsubasa.app | https://prod-project.supabase.co |

## Cost Optimization
- **MVP (50 coaches):** $0/month (free tiers)
- **Growth (500 coaches):** $25/month
- **Scale (5000 coaches):** $125/month

---
