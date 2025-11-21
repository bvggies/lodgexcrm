# Setup Scripts for Deployment

## 🔐 Generate Secrets Script

Create `scripts/generate-secrets.js`:

```javascript
const crypto = require('crypto');

console.log('=== Generate Secrets for Lodgex CRM ===\n');

// JWT Secret (32+ characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// JWT Refresh Secret (32+ characters)
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);

// Encryption Key (exactly 32 characters)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('ENCRYPTION_KEY=' + encryptionKey);

console.log('\n=== Copy these to Vercel Environment Variables ===');
```

Run: `node scripts/generate-secrets.js`

---

## 🗄️ Database Migration Script

Create `scripts/migrate-production.sh`:

```bash
#!/bin/bash
echo "Running database migrations..."

# Pull environment variables from Vercel
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

echo "Migrations complete!"
```

Run: `chmod +x scripts/migrate-production.sh && ./scripts/migrate-production.sh`

---

## 🌱 Seed Database Script

Create `scripts/seed-production.sh`:

```bash
#!/bin/bash
echo "Seeding production database..."

# Pull environment variables
vercel env pull .env.local

# Run seed script
npm run seed

echo "Database seeded!"
```

---

## 🔍 Health Check Script

Create `scripts/check-deployment.sh`:

```bash
#!/bin/bash

BACKEND_URL=$1
FRONTEND_URL=$2

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
  echo "Usage: ./check-deployment.sh <backend-url> <frontend-url>"
  exit 1
fi

echo "Checking backend health..."
curl -f "$BACKEND_URL/health" || echo "❌ Backend health check failed"

echo "\nChecking frontend..."
curl -f "$FRONTEND_URL" || echo "❌ Frontend check failed"

echo "\nChecking API docs..."
curl -f "$BACKEND_URL/api/docs" || echo "❌ API docs check failed"

echo "\n✅ Deployment check complete!"
```

Run: `./check-deployment.sh https://your-backend.vercel.app https://your-frontend.vercel.app`

