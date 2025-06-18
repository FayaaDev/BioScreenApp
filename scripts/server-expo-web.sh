#!/bin/bash

# Server-side Expo Web Setup Script
# Run this on your server to serve Expo app via web

echo "🌐 Setting up Expo Web Server"
echo "============================"

# Navigate to mobile app directory
cd ~/BioScreen/BioScreenMobile

# Install Expo CLI if not installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Set environment variables for server deployment
export EXPO_PUBLIC_API_URL=http://localhost:5000
export EXPO_USE_METRO_REQUIRE=true

echo "🔧 Environment configured:"
echo "API URL: $EXPO_PUBLIC_API_URL"

# Start Expo with web support and tunnel
echo "🚀 Starting Expo with web and tunnel..."
echo "This will:"
echo "1. Create a web version at http://localhost:19006"
echo "2. Create a tunnel URL accessible from anywhere"
echo ""

# Start with tunnel and web
npx expo start --web --tunnel --host tunnel

echo ""
echo "🎯 Access your app:"
echo "1. Web version: http://localhost:19006"
echo "2. Tunnel URL: (will be shown above)"
echo "3. Mobile: Scan QR code with Expo Go app"
