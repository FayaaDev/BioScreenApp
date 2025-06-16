# App Store Deployment Checklist for Bakker

## ✅ Configuration Changes Made

### Core App Configuration
- [x] App name set to "Bakker"
- [x] Bundle identifier set to `com.bakker.app`
- [x] App slug set to `bakker`
- [x] Proper app description and keywords added
- [x] iOS build number and version code configured
- [x] Privacy settings configured

### Required Before Submission

## 📱 **iOS App Store Requirements**

### 1. **Apple Developer Account Setup**
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Create App Store Connect app listing
- [ ] Set up certificates and provisioning profiles
- [ ] Update `eas.json` with your Apple ID and Team ID

### 2. **App Store Connect Configuration**
- [ ] App description (minimum 10 characters)
- [ ] Keywords for search optimization
- [ ] Screenshots (required sizes):
  - iPhone 6.7": 1290×2796 pixels
  - iPhone 6.5": 1242×2688 pixels  
  - iPhone 5.5": 1242×2208 pixels
  - iPad Pro (2nd gen): 2048×2732 pixels
- [ ] App icon (1024×1024 pixels)
- [ ] Privacy policy URL (if collecting data)
- [ ] Support URL
- [ ] Age rating questionnaire
- [ ] App Review Information

### 3. **Required Assets**
- [ ] App icon (1024×1024 for App Store)
- [ ] Screenshots for all device sizes
- [ ] Optional: App preview videos

### 4. **Technical Requirements**
- [x] Proper bundle identifier
- [x] Version and build numbers
- [x] Required permissions and usage descriptions
- [x] Privacy compliance

## 🚀 **Deployment Steps**

### 1. **Install EAS CLI**
```bash
npm install -g @expo/eas-cli
```

### 2. **Login to Expo**
```bash
eas login
```

### 3. **Create Expo Project**
```bash
eas project:init
```

### 4. **Configure Build**
```bash
eas build:configure
```

### 5. **Build for Production**
```bash
# For iOS
eas build --platform ios --profile production

# For Android
eas build --platform android --profile production
```

### 6. **Submit to App Stores**
```bash
# For iOS (after configuring Apple credentials)
eas submit --platform ios --profile production

# For Android (after setting up Google Play credentials)
eas submit --platform android --profile production
```

## 🔧 **Additional Configurations Needed**

### Update these values in your files:

1. **eas.json** - Update with your actual credentials:
   - Apple ID email
   - App Store Connect App ID
   - Apple Team ID
   - Google Play service account key

2. **app.json** - Add if needed:
   - Privacy policy URL
   - Support URL
   - Contact information

### Example Privacy Policy Requirements
Your app collects health-related data, so you'll need a privacy policy that covers:
- What data you collect (screening reminders, dates)
- How data is stored (locally on device)
- No data sharing with third parties
- User control over their data

## 📋 **Final Pre-Submission Checklist**

- [ ] Test app thoroughly on physical devices
- [ ] Verify all notifications work correctly
- [ ] Check app performance and battery usage
- [ ] Ensure compliance with Apple's Health App Guidelines
- [ ] Test on different iOS versions
- [ ] Verify accessibility features work
- [ ] Run through App Store Review Guidelines
- [ ] Prepare app store description and metadata
- [ ] Create marketing screenshots and videos

## 🎯 **Health App Specific Guidelines**

Since Bakker is a health app, ensure:
- [ ] Clear medical disclaimers (if applicable)
- [ ] No medical advice or diagnosis claims
- [ ] Accurate description of health benefits
- [ ] Compliance with medical app guidelines
- [ ] Consider FDA regulations if applicable

## 📞 **Support Information**

Make sure to provide:
- [ ] Support email address
- [ ] App website or landing page
- [ ] Privacy policy hosted online
- [ ] Terms of service (if applicable)

## 🔄 **Version Management**

For future updates:
- Increment version in `app.json`
- iOS build numbers auto-increment with EAS
- Android version codes auto-increment with EAS
- Update App Store metadata as needed
