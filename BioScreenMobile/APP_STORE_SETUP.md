# App Store Connect Setup for Zimam

## Problem
The error "No suitable application records were found" occurs because App Store Connect doesn't have an app record for bundle identifier `com.zimam.app`.

## Solution Options

### Option 1: Use EAS Submit (Recommended - Easiest)

EAS Submit can automatically create the app record in App Store Connect if it doesn't exist.

1. **Make sure you're logged in:**
   ```bash
   eas whoami
   ```

2. **Submit using EAS:**
   ```bash
   cd BioScreenMobile
   eas submit --platform ios --profile production
   ```

3. **Follow the prompts:**
   - EAS will ask if you want to create a new app in App Store Connect
   - Answer "yes" to create the app record automatically
   - Provide your Apple ID credentials when prompted

### Option 2: Create App Record Manually in App Store Connect

If you prefer to create the app record manually:

1. **Go to App Store Connect:**
   - Visit https://appstoreconnect.apple.com/
   - Sign in with your Apple Developer account

2. **Create New App:**
   - Click "My Apps" → "+" button → "New App"
   - Fill in the details:
     - **Platform:** iOS
     - **Name:** زمام (or "Zimam")
     - **Primary Language:** Arabic (or your preferred language)
     - **Bundle ID:** Select `com.zimam.app` (you may need to register it first in Apple Developer Portal)
     - **SKU:** Can be anything unique (e.g., "zimam-ios-001")
     - **User Access:** Full Access (or as needed)

3. **Register Bundle ID (if not already registered):**
   - Go to https://developer.apple.com/account/resources/identifiers/list
   - Click "+" to add a new identifier
   - Select "App IDs" → Continue
   - Select "App" → Continue
   - Description: "Zimam App"
   - Bundle ID: `com.zimam.app` (use "Explicit")
   - Select capabilities (Push Notifications, etc. if needed)
   - Register

4. **After creating the app record, submit via Transporter or EAS:**
   ```bash
   eas submit --platform ios --profile production
   ```

## Important Notes

- **Bundle Identifier:** `com.zimam.app` (already configured in app.config.ts)
- **App Name:** زمام (Zimam)
- **Version:** 1.2
- **Build Number:** 1

## Required Before Submission

Make sure you have:
- [ ] Apple Developer Program membership ($99/year)
- [ ] App Store Connect access
- [ ] Bundle ID `com.zimam.app` registered in Apple Developer Portal
- [ ] App record created in App Store Connect
- [ ] App Store metadata prepared (description, screenshots, etc.)

## Next Steps After Submission

1. Complete App Store metadata in App Store Connect:
   - App description (Arabic and/or English)
   - Keywords
   - Screenshots for required device sizes
   - App icon (1024×1024)
   - Privacy policy URL
   - Support URL
   - Age rating questionnaire

2. Submit for review when ready

