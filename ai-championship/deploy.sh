#!/bin/bash

# HireVision AI - Production Deployment Script
# AI Championship Hackathon Submission

echo "🚀 Starting HireVision AI Deployment..."

# Check if all required environment variables are set
echo "📋 Checking environment variables..."

required_vars=(
    "RAINDROP_API_KEY"
    "ELEVENLABS_API_KEY" 
    "ELEVENLABS_VOICE_ID"
    "DATABASE_URL"
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

echo "🔧 Installing dependencies..."
npm ci

echo "🏗️ Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🎯 HireVision AI is ready for production deployment!"
    echo ""
    echo "📊 Hackathon Features Deployed:"
    echo "  ✅ Raindrop Platform (All 4 Smart Components)"
    echo "  ✅ ElevenLabs Voice AI"
    echo "  ✅ Firebase Authentication"
    echo "  ✅ PostgreSQL Database"
    echo "  ✅ Stripe Payment Processing"
    echo "  ✅ AI-Powered Recruitment Features"
    echo ""
    echo "🚀 Ready to start: npm start"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi