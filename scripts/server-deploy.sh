#!/bin/bash

# Server Deployment Script
# Run this script on your Interserver via SSH to update the app

echo "🔄 BioScreen Server Update"
echo "========================="

# Check current directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in the correct directory. Please cd to your app directory first."
    exit 1
fi

# Step 1: Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed!"
    exit 1
fi

echo "✅ Latest changes pulled successfully!"

# Step 2: Check if package.json changed
if git diff HEAD~1 --name-only | grep -q "package.json"; then
    echo "📦 package.json changed, installing dependencies..."
    npm install --production
    echo "✅ Dependencies updated!"
else
    echo "ℹ️  No dependency changes detected"
fi

# Step 3: Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Step 4: Restart the application
echo "🔄 Restarting application..."

# Try PM2 first
if command -v pm2 &> /dev/null; then
    echo "Using PM2 to restart..."
    pm2 restart bioscreen 2>/dev/null || pm2 start npm --name "bioscreen" -- start
    pm2 status
else
    echo "PM2 not found. You may need to manually restart your application:"
    echo "  npm start"
fi

# Step 5: Test the application
echo ""
echo "🔍 Testing application..."
sleep 3

curl -f http://localhost:5000/api/health &>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Application is running and healthy!"
else
    echo "⚠️  Application may not be responding. Check logs:"
    echo "  pm2 logs bioscreen  # if using PM2"
    echo "  or check your application logs"
fi

echo ""
echo "🎉 Deployment completed!"
echo "🌐 Your app should be available at: http://192.64.87.218:5000"
