# Deployment Guide (Vercel)

## 1. Prerequisites
- A GitHub repository containing this project
- A PostgreSQL database URL (Neon or Supabase)
- A Vercel account

## 2. Required Environment Variables
Add these in Vercel Project Settings:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `KV_REST_API_URL` (optional)

Use this format for `NEXT_PUBLIC_APP_URL`:

- Initial deploy: `https://your-project-name.vercel.app`
- Custom domain later: `https://docs.yourdomain.com` (or your chosen domain)

## 3. Deploy Workflow
1. Push your code to GitHub.
2. In Vercel, click **Add New Project** and import the repo.
3. Confirm build settings:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output: Next.js default
4. Add environment variables.
5. Click **Deploy**.

## 4. Set Live Domain Value (Important)
After first deploy, Vercel assigns a live URL such as:

- `https://mini-wiki-abc123.vercel.app`

Update `NEXT_PUBLIC_APP_URL` in Vercel to that exact URL (or your custom domain), then redeploy.

Why this matters:
- The app metadata (`metadataBase`, canonical URL, Open Graph URL) reads from `NEXT_PUBLIC_APP_URL`.

## 5. Redeploy After Updates
After future code changes:
1. Push to the connected branch.
2. Vercel auto-deploys.
3. If environment variables changed, trigger a redeploy from Vercel dashboard.

## 6. Post-Deploy Validation
- Open homepage and confirm article list loads.
- Search for a keyword (for example `history`) and confirm results render.
- Search by topic (for example `#history`) and confirm topic mode works.
- Open an article and verify views increment.
- Like an article and verify likes update.
- Update profile theme color and verify UI updates.
- Check canonical/Open Graph tags in page source use your configured domain.

## 7. Custom Domain Notes
Custom domain setup is done in Vercel project settings:

- `Project -> Settings -> Domains`

After attaching a custom domain, update `NEXT_PUBLIC_APP_URL` to the custom domain and redeploy.

## 8. Local-to-Prod Parity
Local run:

```bash
npm install
npm run dev
```

For local `.env.local`, you may use:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Production should always use your Vercel URL or custom domain.
