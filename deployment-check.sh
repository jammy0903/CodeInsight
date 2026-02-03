#!/bin/bash

echo "🔍 CodeInsight Deployment Health Check"
echo "========================================"
echo ""

# Backend URL (수정 필요!)
BACKEND_URL="https://codeinsight-backend.onrender.com"

# Frontend URL (수정 필요!)
FRONTEND_URL="https://code-insight.vercel.app"

echo "📍 Backend URL: $BACKEND_URL"
echo "📍 Frontend URL: $FRONTEND_URL"
echo ""

# Backend Health Check
echo "🏥 Checking backend health..."
if curl -f -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
    curl -s "$BACKEND_URL/health" | jq '.' 2>/dev/null || curl -s "$BACKEND_URL/health"
else
    echo "❌ Backend health check failed!"
    echo "💡 Tip: Backend might still be deploying (first deploy takes 10-15 minutes)"
fi

echo ""
echo "🌐 Checking frontend..."
if curl -f -s -o /dev/null "$FRONTEND_URL"; then
    echo "✅ Frontend is accessible!"
else
    echo "❌ Frontend is not accessible!"
    echo "💡 Tip: Check Vercel deployment logs"
fi

echo ""
echo "✅ Deployment check complete!"
echo "🔗 Open in browser:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL/health"
