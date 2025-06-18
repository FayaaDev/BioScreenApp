#!/bin/bash

# Server Deployment Fix Script
# Run this on your Interserver to properly deploy

echo "🔧 BioScreen Server Deployment Fix"
echo "=================================="

# Step 1: Navigate to the correct directory
echo "📁 Step 1: Navigating to correct directory..."
cd ~/BioScreen
pwd

# Step 2: Check git status
echo ""
echo "📋 Step 2: Checking git status..."
git status

# Step 3: Handle conflicting changes
echo ""
echo "🔄 Step 3: Handling local changes..."
echo "Stashing local changes..."
git stash

# Step 4: Pull latest changes
echo ""
echo "📥 Step 4: Pulling latest changes..."
git pull origin main

# Step 5: Check if package.json changed
echo ""
echo "📦 Step 5: Checking for dependency changes..."
if git diff HEAD~1 --name-only | grep -q "package.json"; then
    echo "package.json changed, installing dependencies..."
    npm install --production
else
    echo "No dependency changes detected"
fi

# Step 6: Build the application (from main directory, not BioScreenMobile)
echo ""
echo "🔨 Step 6: Building application..."
npm run build

# Step 7: Restart the application
echo ""
echo "🔄 Step 7: Restarting application..."
if command -v pm2 &> /dev/null; then
    echo "Using PM2..."
    pm2 restart all || pm2 start npm --name "bioscreen" -- start
    pm2 status
else
    echo "PM2 not found. Starting with npm..."
    echo "You may need to run: npm start"
fi

# Step 8: Test the application
echo ""
echo "🔍 Step 8: Testing application..."
sleep 3
curl -f http://localhost:5000/api/health

if [ $? -eq 0 ]; then
    echo "✅ Application is running successfully!"
    echo "🌐 Your app should be available at: http://192.64.87.218:5000"
else
    echo "❌ Application may not be responding. Check logs:"
    echo "Run: pm2 logs bioscreen"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "If you had local changes that were stashed, you can:"
echo "  git stash list    # See stashed changes"
echo "  git stash pop     # Restore them (if needed)"
