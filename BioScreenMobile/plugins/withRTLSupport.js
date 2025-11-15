const { withAppDelegate } = require('@expo/config-plugins');

/**
 * Expo config plugin to add RTL support at native iOS level
 */
const withRTLSupport = (config) => {
  return withAppDelegate(config, (config) => {
    const appDelegate = config.modResults.contents;

    // Check if RTL code already exists
    if (appDelegate.includes('semanticContentAttribute')) {
      return config;
    }

    // Add UIKit import if not present
    if (!appDelegate.includes('import UIKit')) {
      appDelegate = appDelegate.replace(
        /(import Expo[\s\S]*?import ReactAppDependencyProvider)/,
        '$1\nimport UIKit'
      );
    }

    // Add RTL setup code in didFinishLaunchingWithOptions
    const rtlSetupCode = `
    // Force RTL layout at native level before React Native initializes
    // This is critical for iOS to respect RTL layout from the start
    // Set RTL for all UIViews globally
    UIView.appearance().semanticContentAttribute = .forceRightToLeft
    `;

    const windowSetupCode = `
    // Ensure window has RTL semantic content attribute
    window?.semanticContentAttribute = .forceRightToLeft
    `;

    const rtlAfterStartCode = `
    // Force RTL on root view controller after React Native starts
    // Use a small delay to ensure rootViewController is set
    DispatchQueue.main.async {
      if let rootViewController = self.window?.rootViewController {
        rootViewController.view.semanticContentAttribute = .forceRightToLeft
        // Also set on the window itself
        self.window?.semanticContentAttribute = .forceRightToLeft
      }
    }
    `;

    // Insert RTL setup after delegate creation but before factory setup
    if (appDelegate.includes('let delegate = ReactNativeDelegate()')) {
      appDelegate = appDelegate.replace(
        /(let delegate = ReactNativeDelegate\(\))/,
        `${rtlSetupCode}$1`
      );
    }

    // Insert window RTL setup
    if (appDelegate.includes('window = UIWindow')) {
      appDelegate = appDelegate.replace(
        /(window = UIWindow\(frame: UIScreen\.main\.bounds\))/,
        `$1\n${windowSetupCode}`
      );
    }

    // Insert RTL after React Native starts
    if (appDelegate.includes('factory.startReactNative')) {
      appDelegate = appDelegate.replace(
        /(factory\.startReactNative\([\s\S]*?launchOptions: launchOptions\))/,
        `$1\n${rtlAfterStartCode}`
      );
    }

    config.modResults.contents = appDelegate;
    return config;
  });
};

module.exports = withRTLSupport;

