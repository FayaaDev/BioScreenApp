#!/bin/bash

# Script to build and submit Zimam app to Apple App Store
# Run this script from the BioScreenMobile directory

set -e

echo "🚀 Zimam - Apple App Store Submission"
echo "======================================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Please install it with: npm install -g eas-cli"
    exit 1
fi

# Check if logged in
echo "📋 Checking EAS login status..."
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to EAS. Please run: eas login"
    exit 1
fi

echo "✅ Logged in as: $(eas whoami)"
echo ""

# Initialize EAS project if needed
echo "🔧 Configuring EAS project..."
if ! eas project:info &> /dev/null; then
    echo "⚠️  EAS project not configured. This will create a new project."
    echo "   Please answer 'yes' when prompted to create a project for @fayaa/zimam"
    eas project:init || {
        echo "❌ Failed to initialize EAS project"
        exit 1
    }
else
    echo "✅ EAS project already configured"
fi

echo ""
echo "📦 Building iOS app for production..."
echo "   This may take 15-30 minutes..."
echo ""

# Build the iOS app
eas build --platform ios --profile production

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📤 Submitting to Apple App Store..."
echo "   You may be prompted for Apple credentials if not already configured."
echo ""

# Submit to App Store
eas submit --platform ios --profile production

echo ""
echo "🎉 Submission completed!"
echo ""
echo "Next steps:"
echo "1. Check App Store Connect for submission status"
echo "2. Complete app metadata (screenshots, description, etc.)"
echo "3. Submit for review when ready"
echo ""

