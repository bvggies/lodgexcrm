#!/bin/bash
# Script to run Prisma migrations on Vercel

echo "🔧 Running Prisma migrations..."

# Pull environment variables from Vercel
echo "📥 Pulling environment variables..."
vercel env pull .env.local

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🚀 Running migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed!"

