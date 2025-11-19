#!/bin/bash

# Deployment Health Check Script
# Usage: ./scripts/check-deployment.sh <backend-url> <frontend-url>

BACKEND_URL=$1
FRONTEND_URL=$2

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
  echo "❌ Usage: ./scripts/check-deployment.sh <backend-url> <frontend-url>"
  echo "   Example: ./scripts/check-deployment.sh https://lodgexcrm-backend.vercel.app https://lodgexcrm-frontend.vercel.app"
  exit 1
fi

echo "🔍 Checking Deployment Health..."
echo "=================================="
echo ""

# Check backend health
echo "1. Checking Backend Health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
  echo "   ✅ Backend is healthy ($BACKEND_URL/health)"
else
  echo "   ❌ Backend health check failed (HTTP $HEALTH_RESPONSE)"
fi

# Check API docs
echo ""
echo "2. Checking API Documentation..."
DOCS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/docs")
if [ "$DOCS_RESPONSE" = "200" ]; then
  echo "   ✅ API docs accessible ($BACKEND_URL/api/docs)"
else
  echo "   ❌ API docs not accessible (HTTP $DOCS_RESPONSE)"
fi

# Check frontend
echo ""
echo "3. Checking Frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
  echo "   ✅ Frontend is accessible ($FRONTEND_URL)"
else
  echo "   ❌ Frontend not accessible (HTTP $FRONTEND_RESPONSE)"
fi

# Check API endpoint
echo ""
echo "4. Checking API Endpoint..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/auth/login" -X POST -H "Content-Type: application/json" -d '{}')
if [ "$API_RESPONSE" = "400" ] || [ "$API_RESPONSE" = "422" ]; then
  echo "   ✅ API endpoint is responding (expected validation error)"
else
  echo "   ⚠️  API endpoint returned HTTP $API_RESPONSE"
fi

echo ""
echo "=================================="
echo "✅ Deployment check complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Visit frontend: $FRONTEND_URL"
echo "   2. Test login functionality"
echo "   3. Check API docs: $BACKEND_URL/api/docs"
echo ""

