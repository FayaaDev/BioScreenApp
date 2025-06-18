#!/bin/bash

# GitHub-based Deployment Script for Interserver
# This script pushes changes to GitHub and provides SSH commands for server deployment

echo "🚀 BioScreen GitHub Deployment Workflow"
echo "======================================="

# Step 1: Check git status
echo "� Checking git status..."
git status

# Step 2: Add and commit changes
echo ""
read -p "📝 Enter commit message: " commit_message

if [ -z "$commit_message" ]; then
    commit_message="Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "� Adding and committing changes..."
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
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Push failed! Please check your connection and try again."
    exit 1
fi

echo "✅ Changes pushed to GitHub successfully!"

# Step 4: Provide SSH commands for server
echo ""
echo "�️  Now run these commands on your Interserver via SSH:"
echo "======================================================"
echo ""
echo "# 1. Connect to your server:"
echo "ssh your-username@192.64.87.218"
echo ""
echo "# 2. Navigate to your app directory:"
echo "cd /path/to/your/bioscreen/app"
echo ""
echo "# 3. Pull latest changes:"
echo "git pull origin main"
echo ""
echo "# 4. Install dependencies (if package.json changed):"
echo "npm install"
echo ""
echo "# 5. Rebuild and restart:"
echo "npm run build"
echo "pm2 restart bioscreen  # or: npm start"
echo ""
echo "# 6. Check status:"
echo "pm2 status  # or check if server is running"
echo ""

# Step 5: Test connection
echo "🔍 Testing connection to server..."
sleep 2
curl -f http://192.64.87.218:5000/api/health

if [ $? -eq 0 ]; then
    echo "✅ Server is responding!"
else
    echo "⚠️  Server not responding - you may need to restart it via SSH"
fi

echo ""
echo "🎉 Local deployment process completed!"
echo "💡 Don't forget to run the SSH commands above on your server!"
