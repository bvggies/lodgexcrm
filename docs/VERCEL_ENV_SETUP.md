# Vercel Environment Variables Setup

## Required Environment Variables

Make sure these are set in your Vercel backend project:

### Go to: Vercel Dashboard → Your Backend Project → Settings → Environment Variables

Add these variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_0DZkHhcsNP7W@ep-royal-sky-ahp86q9n-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Important**: 
- Select **all environments** (Production, Preview, Development)
- Click **Save** after adding each variable

## Generate Secrets

Run this to generate secure secrets:

```bash
node scripts/generate-secrets.js
```

Then add to Vercel:
- `JWT_SECRET` (32+ characters)
- `JWT_REFRESH_SECRET` (32+ characters)  
- `ENCRYPTION_KEY` (exactly 32 characters)

## Other Required Variables

```
CORS_ORIGIN=https://your-frontend.vercel.app
NODE_ENV=production
```

## Optional Variables (for full functionality)

```
REDIS_URL=redis://... (for job queue)
AWS_ACCESS_KEY_ID=... (for file uploads)
AWS_SECRET_ACCESS_KEY=... (for file uploads)
AWS_REGION=us-east-1
AWS_BUCKET=your-bucket-name
```

## After Setting Variables

1. **Redeploy** your backend project in Vercel
2. Test the endpoints:
   - `https://your-backend.vercel.app/`
   - `https://your-backend.vercel.app/health`
   - `https://your-backend.vercel.app/api/docs`

