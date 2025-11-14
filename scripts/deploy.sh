#!/bin/bash

# GitHub-based Deployment Script for BioScreen
# This script pushes changes to GitHub and deploys to bakkerapp.com

echo "🚀 BioScreen GitHub Deployment Workflow"
echo "======================================="

# Step 1: Check git status
echo "📊 Checking git status..."
git status

# Step 2: Add and commit changes
echo ""
read -p "📝 Enter commit message: " commit_message

if [ -z "$commit_message" ]; then
    commit_message="Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "📦 Adding and committing changes..."
git add .
git commit -m "$commit_message"

if [ $? -ne 0 ]; then
    echo "⚠️  No changes to commit or commit failed"
else
    echo "✅ Changes committed successfully!"
fi

# Step 3: Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push origin master

if [ $? -ne 0 ]; then
    echo "❌ Push failed! Please check your connection and try again."
    exit 1
fi

echo "✅ Changes pushed to GitHub successfully!"

# Step 4: Deploy to server
echo ""
echo "🖥️  Deploying to bakkerapp.com..."
echo "======================================================"

# Check if credentials are configured
ssh root@bakkerapp.com 'cd /var/www/bioscreen && git config credential.helper' > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "⚙️  Setting up git credential helper..."
    ssh root@bakkerapp.com 'git config --global credential.helper store'
    echo "📝 Note: You'll be prompted for GitHub credentials on first pull"
    echo "    Username: FayaaDev"
    echo "    Password: Use your GitHub Personal Access Token"
    echo ""
fi

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
ssh root@bakkerapp.com 'cd /var/www/bioscreen && git pull origin master'

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Git pull failed!"
    echo ""
    echo "If you see 'Permission denied' or credential errors, run this manually:"
    echo "  ssh root@bakkerapp.com"
    echo "  cd /var/www/bioscreen"
    echo "  git pull origin master"
    echo ""
    echo "When prompted for credentials:"
    echo "  Username: FayaaDev"
    echo "  Password: <paste your GitHub Personal Access Token>"
    echo ""
    echo "After successful pull, continue with:"
    echo "  npm install"
    echo "  npm run build"
    echo "  pm2 restart all"
    exit 1
fi

echo "✅ Code pulled successfully!"

# Install dependencies and rebuild
echo ""
echo "📦 Installing dependencies and rebuilding..."
ssh root@bakkerapp.com 'cd /var/www/bioscreen && npm install && npm run build'

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Restart PM2
echo ""
echo "🔄 Restarting application..."
ssh root@bakkerapp.com 'cd /var/www/bioscreen && pm2 restart all'

echo "✅ Application restarted!"

# Step 5: Test connection
echo ""
echo "🔍 Testing connection to bakkerapp.com..."
sleep 3
curl -f https://bakkerapp.com/api/health 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Server is responding!"
else
    echo "⚠️  Server health check failed - checking if site is up..."
    curl -I https://bakkerapp.com 2>/dev/null | head -n 1
fi

echo ""
echo "🎉 Deployment completed!"
echo "🌐 Visit: https://bakkerapp.com"
