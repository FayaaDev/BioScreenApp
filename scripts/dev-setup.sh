#!/bin/bash

# Development Environment Setup Script
# This script helps you quickly switch between local and Interserver backend testing

echo "🚀 BioScreen Development Environment Setup"
echo "=========================================="

case "$1" in
  "local")
    echo "📱 Starting with LOCAL backend..."
    export VITE_API_URL=http://localhost:5000
    export EXPO_PUBLIC_API_URL=http://localhost:5000
    echo "✅ Environment variables set for local development"
    ;;
  "interserver")
    echo "🌐 Starting with INTERSERVER backend..."
    export VITE_API_URL=http://192.64.87.218:5000
    export EXPO_PUBLIC_API_URL=http://192.64.87.218:5000
    echo "✅ Environment variables set for Interserver testing"
    ;;
  "test")
    echo "🔍 Testing connection to Interserver..."
    curl -f http://192.64.87.218:5000/api/health
    if [ $? -eq 0 ]; then
      echo "✅ Interserver backend is reachable"
    else
      echo "❌ Cannot reach Interserver backend"
    fi
    exit 0
    ;;
  *)
    echo "Usage: $0 {local|interserver|test}"
    echo ""
    echo "Commands:"
    echo "  local       - Set environment for local backend development"
    echo "  interserver - Set environment for Interserver backend testing"
    echo "  test        - Test connection to Interserver backend"
    echo ""
    echo "Examples:"
    echo "  ./scripts/dev-setup.sh local"
    echo "  ./scripts/dev-setup.sh interserver"
    echo "  ./scripts/dev-setup.sh test"
    exit 1
    ;;
esac

echo ""
echo "🎯 Quick commands:"
echo "  Web Client:  npm run dev"
echo "  Mobile App:  cd BioScreenMobile && npx expo start"
echo "  Test API:    Open api-tests.http in VS Code"
echo ""
echo "💡 Tip: Use VS Code tasks (Ctrl+Shift+P -> Tasks: Run Task) for easier development!"
