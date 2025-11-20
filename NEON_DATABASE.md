# Neon Database Configuration

## Your Database Connection String

```
postgresql://neondb_owner:npg_0DZkHhcsNP7W@ep-royal-sky-ahp86q9n-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Usage

### For Local Development

Add this to `backend/.env`:

```env
DATABASE_URL=postgresql://neondb_owner:npg_0DZkHhcsNP7W@ep-royal-sky-ahp86q9n-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### For Vercel Deployment

1. Go to your Vercel project (backend)
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_0DZkHhcsNP7W@ep-royal-sky-ahp86q9n-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - **Environment**: Production, Preview, Development (select all)

## Run Migrations

After setting up the connection string, run migrations:

```bash
cd backend
npx prisma migrate deploy
```

Or via Vercel CLI:

```bash
cd backend
vercel env pull .env.local
npx prisma migrate deploy
```

## Test Connection

```bash
cd backend
npx prisma db pull
```

If successful, you're connected! ✅

## Important Notes

⚠️ **Security**: 
- This connection string contains your database password
- Never commit it to Git (it's already in `.gitignore`)
- Keep it secure and don't share it publicly

🔒 **Best Practice**:
- Consider rotating the password periodically
- Use environment variables in production
- Never hardcode credentials in your code

