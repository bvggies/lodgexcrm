# Fix for "Cannot GET /" Error on Vercel

## Problem
After deploying to Vercel, you get "Cannot GET /" error when accessing the root URL.

## Solution Applied

### 1. Added Root Route
Added a root route handler in `backend/src/server.ts`:
```typescript
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lodgex CRM API', 
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs'
    }
  });
});
```

### 2. Updated Vercel Configuration
Updated `backend/vercel.json` to use the correct entry point:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ]
}
```

### 3. Serverless Compatibility
Updated server to not listen on port in serverless environment:
```typescript
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  app.listen(PORT, async () => {
    // ... server startup
  });
}
```

## Testing After Deployment

After Vercel redeploys, test these URLs:

1. **Root**: `https://your-backend.vercel.app/`
   - Should return: `{ message: "Lodgex CRM API", ... }`

2. **Health**: `https://your-backend.vercel.app/health`
   - Should return: `{ status: "ok", ... }`

3. **API**: `https://your-backend.vercel.app/api`
   - Should return: `{ message: "Lodgex CRM API", version: "1.0.0" }`

4. **Docs**: `https://your-backend.vercel.app/api/docs`
   - Should show Swagger UI

## If Still Not Working

1. **Check Vercel Build Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Check "Build Logs" for errors

2. **Verify Environment Variables**:
   - Go to Settings → Environment Variables
   - Ensure `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` are set
   - Ensure `CORS_ORIGIN` is set to your frontend URL

3. **Check Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions
   - Check for runtime errors

4. **Redeploy**:
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment

## Common Issues

### Issue: Still getting "Cannot GET /"
**Solution**: 
- Make sure `backend/api/index.ts` exists and exports the app
- Verify `vercel.json` points to `api/index.ts`
- Check that the build completed successfully

### Issue: 500 Internal Server Error
**Solution**:
- Check environment variables are set correctly
- Verify database connection string is correct
- Check function logs in Vercel dashboard

### Issue: CORS errors
**Solution**:
- Set `CORS_ORIGIN` environment variable to your frontend URL
- Format: `https://your-frontend.vercel.app` (no trailing slash)

