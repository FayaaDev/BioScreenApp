#!/bin/bash

# Complete Deployment Guide
# Run this guide to understand the full deployment process

echo "🎯 BioScreen Deployment Flow Guide"
echo "=================================="
echo ""

echo "📱 Step 1: Local Development (DONE)"
echo "   - Make changes locally"
echo "   - Test with: npm run dev:backend-only"
echo "   - Mobile app uses: http://localhost:5000"
echo ""

echo "📤 Step 2: Push to GitHub (DONE)"  
echo "   - VS Code Task: 'Deploy to GitHub' or 'Quick Push to GitHub'"
echo "   - Or manually: git add . && git commit -m 'message' && git push"
echo ""

echo "🚨 Step 3: Deploy to Interserver (MISSING - MANUAL STEP REQUIRED)"
echo "   This does NOT happen automatically!"
echo ""
echo "   You need to SSH into your server and run:"
echo "   ----------------------------------------"
echo "   ssh your-username@192.64.87.218"
echo "   cd /path/to/your/bioscreen/app"
echo "   git pull origin main"
echo "   npm install  # if package.json changed"
echo "   npm run build"
echo "   pm2 restart bioscreen  # or restart your server process"
echo ""

echo "🔍 Step 4: Verify Deployment"
echo "   - Test: curl http://192.64.87.218:5000/api/health"
echo "   - Or use VS Code task: 'Test Interserver Connection'"
echo ""

echo "💡 IMPORTANT: Changes are NOT automatically deployed!"
echo "   - GitHub push ≠ Server deployment"
echo "   - You must manually run Step 3 on your server"
echo ""

echo "🎮 To test your changes on mobile against Interserver:"
echo "   - Run VS Code task: 'Mobile App - Interserver Backend'"
echo "   - This points mobile app to: http://192.64.87.218:5000"
echo ""

echo "Current Status Check:"
echo "-------------------"
echo "Testing connection to Interserver..."
curl -f http://192.64.87.218:5000/api/health 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Interserver is responding"
    echo "But this doesn't mean your latest changes are deployed!"
else
    echo "❌ Interserver is not responding"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. SSH into your Interserver"
echo "2. Run the deployment commands above"
echo "3. Test your changes with mobile app pointing to Interserver"
