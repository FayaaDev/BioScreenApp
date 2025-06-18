#!/bin/bash

# Quick Push Script - Push changes to GitHub quickly
echo "⚡ Quick Push to GitHub"
echo "====================="

# Check if there are changes
if git diff-index --quiet HEAD --; then
    echo "ℹ️  No changes to commit"
    exit 0
fi

# Quick commit with timestamp
commit_message="Quick update: $(date '+%Y-%m-%d %H:%M:%S')"
echo "📝 Committing: $commit_message"

git add .
git commit -m "$commit_message"
git push origin main

echo "✅ Changes pushed to GitHub!"
echo ""
echo "💡 Now SSH to your server and run:"
echo "   cd /path/to/your/app && git pull && npm run build && pm2 restart bioscreen"
