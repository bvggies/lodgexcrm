# PowerShell script to run Prisma migrations on Vercel

Write-Host "🔧 Running Prisma migrations..." -ForegroundColor Cyan

# Pull environment variables from Vercel
Write-Host "📥 Pulling environment variables..." -ForegroundColor Yellow
vercel env pull .env.local

# Generate Prisma client
Write-Host "🔨 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Run migrations
Write-Host "🚀 Running migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

Write-Host "✅ Migrations completed!" -ForegroundColor Green

