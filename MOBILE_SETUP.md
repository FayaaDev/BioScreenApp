# Sehaty Mobile App Setup Guide

Your health screening app has been successfully configured with Capacitor for iOS and Android development.

## What's Been Configured

- **App Name**: صحتي - Sehaty
- **Bundle ID**: com.sehaty.app
- **Platforms**: iOS and Android
- **Build Output**: dist/public

## Capacitor Plugins Installed

- **@capacitor/app**: Core app functionality
- **@capacitor/splash-screen**: Custom splash screen with green branding
- **@capacitor/status-bar**: Status bar styling
- **@capacitor/haptics**: Touch feedback
- **@capacitor/keyboard**: Keyboard handling

## Mobile Development Commands

### Build and Sync
```bash
# Build the web app for mobile
vite build

# Sync web assets to mobile platforms
npx cap sync

# Build and sync in one command
vite build && npx cap sync
```

### iOS Development
```bash
# Open iOS project in Xcode
npx cap open ios

# Run on iOS simulator/device
npx cap run ios
```

### Android Development
```bash
# Open Android project in Android Studio
npx cap open android

# Run on Android emulator/device
npx cap run android
```

## Mobile-Specific Features

### Splash Screen
- Background color: #008553 (your brand green)
- Duration: 2 seconds
- Full screen with no spinner

### Status Bar
- Light content style
- Green background matching your brand

### Benefits of Native App

1. **Better Performance**: Native rendering resolves Safari color issues
2. **App Store Distribution**: Can be published to iOS App Store and Google Play
3. **Native Features**: Access to device features like notifications, camera, etc.
4. **Offline Support**: Better caching and offline functionality
5. **Native UI**: Proper mobile gestures and interactions

## Next Steps

1. **iOS Development**: Install Xcode on macOS and run `npx cap open ios`
2. **Android Development**: Install Android Studio and run `npx cap open android`
3. **Testing**: Use simulators/emulators or physical devices
4. **Publishing**: Configure app icons, splash screens, and store metadata

## Development Workflow

1. Make changes to your web app
2. Run `vite build` to build the web assets
3. Run `npx cap sync` to copy assets to mobile platforms
4. Open the native IDE and run on devices/simulators

The mobile app will have the same functionality as your web app but with native mobile performance and proper color rendering.