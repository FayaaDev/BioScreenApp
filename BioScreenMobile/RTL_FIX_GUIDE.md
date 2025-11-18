# React Native RTL Implementation Guide

## Overview
This guide documents the complete solution for implementing proper Right-to-Left (RTL) support in React Native applications, specifically for Arabic language interfaces. The solution follows best practices and avoids common pitfalls.

## Problem Statement
React Native doesn't automatically apply RTL layout just because `I18nManager` is configured. Simply using `textAlign: 'auto'` or forcing RTL at app startup causes several issues:
- Text doesn't align properly to the right
- Layouts remain left-aligned
- Interactive elements (buttons, checkboxes, radio buttons) appear on the wrong side
- Input placeholders don't respect RTL direction

## Complete Solution

### 1. **Dynamic RTL Initialization (rtlSetup.ts)**

**❌ WRONG - Forcing RTL at startup:**
```typescript
// Don't do this!
I18nManager.allowRTL(true);
I18nManager.forceRTL(true); // ❌ Forces RTL before checking user preference
```

**✅ CORRECT - Dynamic RTL based on user preference:**
```typescript
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

const LANGUAGE_STORAGE_KEY = '@app_language';

// Allow RTL support but don't force it at initialization
I18nManager.allowRTL(true);

export async function initRTL(): Promise<void> {
  // Read stored language preference early
  let preferredLanguage = 'ar'; // Default to Arabic
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && typeof stored === 'string') {
      preferredLanguage = stored;
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Could not load language preference:', error);
    }
  }

  const shouldUseRTL = preferredLanguage === 'ar';

  // Log in dev mode for verification
  if (__DEV__) {
    console.log('Language:', preferredLanguage);
    console.log('I18nManager.isRTL:', I18nManager.isRTL);
    console.log('Should use RTL:', shouldUseRTL);
  }

  // Apply runtime direction only if needed
  const needsFlip = I18nManager.isRTL !== shouldUseRTL;
  if (needsFlip) {
    try {
      I18nManager.forceRTL(shouldUseRTL);
      
      // On iOS/Android, reload app to apply direction change
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Updates.reloadAsync();
      }
    } catch (error) {
      if (__DEV__) {
        console.log('Could not flip RTL direction:', error);
      }
    }
  }

  // Web: set <html dir="...">
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = shouldUseRTL ? 'rtl' : 'ltr';
  }
}

export function getIsRTL(): boolean {
  return I18nManager.isRTL;
}
```

**Key Points:**
- ✅ Read language preference from storage first
- ✅ Only call `forceRTL()` if direction needs to change
- ✅ Use `Updates.reloadAsync()` for iOS/Android (requires `expo-updates` package)
- ✅ Set `document.documentElement.dir` for web
- ✅ Add dev logging for debugging

### 2. **Import I18nManager in Every Screen**

**❌ WRONG - Using RTL without import:**
```typescript
// In component file
const styles = StyleSheet.create({
  container: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', // ❌ Error!
  },
});
```

**✅ CORRECT - Always import I18nManager:**
```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  I18nManager, // ✅ Import I18nManager
} from 'react-native';
```

### 3. **Text Alignment - Use writingDirection**

**❌ WRONG - Using textAlign: 'auto':**
```typescript
const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    textAlign: 'auto', // ❌ Doesn't work properly in React Native
  },
});
```

**✅ CORRECT - Use writingDirection:**
```typescript
const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr', // ✅ Explicit direction
  },
});
```

### 4. **TextInput Alignment**

**❌ WRONG - Using textAlign prop:**
```typescript
<TextInput
  style={styles.input}
  placeholder="أدخل النص..."
  textAlign="auto" // ❌ Remove this
/>
```

**✅ CORRECT - Use writingDirection in style:**
```typescript
<TextInput
  style={styles.input}
  placeholder="أدخل النص..."
  // No textAlign prop needed
/>

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    padding: 12,
    fontSize: 16,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr', // ✅ In style
  },
});
```

### 5. **FlexDirection for Directional Layouts**

**❌ WRONG - Static flexDirection:**
```typescript
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // ❌ Always left-to-right
  },
  statusContainer: {
    flexDirection: 'row-reverse', // ❌ Always right-to-left
  },
});
```

**✅ CORRECT - Dynamic flexDirection based on RTL:**
```typescript
const styles = StyleSheet.create({
  // For containers with directional content (icon + text, buttons, etc.)
  container: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  
  // For button containers (should flip in RTL)
  buttonContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: 8,
  },
  
  // For footer with action buttons
  footer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    padding: 16,
  },
});
```

### 6. **Radio Buttons and Checkboxes Alignment**

**❌ WRONG - Circle/checkbox on wrong side:**
```typescript
const styles = StyleSheet.create({
  radioOption: {
    flexDirection: 'row-reverse', // ❌ Puts circle on left for RTL
    alignItems: 'center',
  },
});
```

**✅ CORRECT - Circle/checkbox on same side as text:**
```typescript
const styles = StyleSheet.create({
  radioOption: {
    // For RTL: 'row' puts text first (right), then circle (left aligned to text)
    // For LTR: 'row-reverse' puts text first (left), then circle (right aligned to text)
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginStart: 8, // ✅ Logical spacing (adapts to direction)
  },
  checkboxOption: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
  },
});
```

### 7. **Logical Spacing Properties**

**❌ WRONG - Using left/right:**
```typescript
const styles = StyleSheet.create({
  text: {
    marginLeft: 12,  // ❌ Fixed direction
    paddingRight: 8, // ❌ Fixed direction
    borderLeftWidth: 4, // ❌ Fixed direction
  },
});
```

**✅ CORRECT - Using Start/End:**
```typescript
const styles = StyleSheet.create({
  text: {
    marginStart: 12,  // ✅ Adapts to direction
    paddingEnd: 8,    // ✅ Adapts to direction
    borderStartWidth: 4, // ✅ Adapts to direction
    borderStartColor: '#f59e0b',
  },
  
  statusDot: {
    width: 8,
    height: 8,
    marginStart: 8, // ✅ Space adapts to RTL/LTR
  },
});
```

### 8. **Remove Unnecessary marginStart from Text**

**❌ WRONG - Adding margin to text containers:**
```typescript
const styles = StyleSheet.create({
  templateName: {
    flex: 1,
    fontSize: 18,
    marginStart: 12, // ❌ Pushes text in wrong direction
  },
});
```

**✅ CORRECT - No margin on text containers:**
```typescript
const styles = StyleSheet.create({
  templateName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
    // No marginStart needed
  },
});
```

## Implementation Checklist

### ✅ Required Setup
- [ ] Add `expo-updates` to package.json
- [ ] Create `rtlSetup.ts` with dynamic RTL initialization
- [ ] Call `initRTL()` in App.tsx useEffect
- [ ] Import `I18nManager` in all screen components

### ✅ Text Styling
- [ ] Replace all `textAlign: 'auto'` with `writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr'`
- [ ] Remove `textAlign="auto"` props from TextInput components
- [ ] Use `writingDirection` in input styles

### ✅ Layout Direction
- [ ] Update all directional containers to use `flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row'`
- [ ] Fix radio buttons: `flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse'`
- [ ] Fix checkboxes: `flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse'`

### ✅ Spacing
- [ ] Replace `marginLeft/Right` with `marginStart/End`
- [ ] Replace `paddingLeft/Right` with `paddingStart/End`
- [ ] Replace `borderLeftWidth/Color` with `borderStartWidth/Color`
- [ ] Remove unnecessary `marginStart` from text containers

### ✅ Platform-Specific
- [ ] Verify Info.plist doesn't force Arabic (no hardcoded CFBundleDevelopmentRegion)
- [ ] Ensure AppDelegate.swift doesn't set native RTL flags
- [ ] Test web version sets `document.documentElement.dir`

## Testing Checklist

### Visual Testing
- [ ] All text aligns to the right in RTL mode
- [ ] All input placeholders align to the right
- [ ] Radio buttons appear on the right side with text
- [ ] Checkboxes appear on the right side with text
- [ ] Button containers flow from right to left
- [ ] Status indicators and icons are properly positioned
- [ ] Borders appear on the correct side

### Functional Testing
- [ ] App reloads successfully when changing language (iOS)
- [ ] Direction persists after app restart
- [ ] No layout shift or flickering on initial load
- [ ] All interactive elements remain clickable

### Developer Testing
- [ ] Check dev console for language and RTL state logs
- [ ] Verify no I18nManager import errors
- [ ] Confirm no TypeScript/compilation errors
- [ ] Test switching between Arabic and English (if supported)

## Common Pitfalls to Avoid

1. **Don't force RTL at module level** - Always check user preference first
2. **Don't use `textAlign: 'auto'`** - Use `writingDirection` instead
3. **Don't forget to import I18nManager** - Required in every component using RTL
4. **Don't use fixed left/right properties** - Use logical Start/End properties
5. **Don't use `row-reverse` for radio/checkbox** - Use `row` for RTL mode
6. **Don't add marginStart to text containers** - Let `writingDirection` handle alignment

## Script for Bulk Updates

If you need to update many files at once, use this bash script:

```bash
# Replace textAlign: 'auto' with writingDirection
find ./src -name "*.tsx" -type f -exec sed -i '' \
  "s/textAlign: 'auto',/writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',/g" {} \;

# Remove textAlign="auto" props from components
find ./src -name "*.tsx" -type f -exec sed -i '' '/textAlign="auto"/d' {} \;
```

## Dependencies Required

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^2.2.0",
    "expo-updates": "~0.28.3",
    "react-native": "0.81.5"
  }
}
```

## Summary

The key to proper RTL support in React Native is:

1. **Dynamic initialization** - Read user preference, then apply RTL
2. **Explicit direction** - Use `writingDirection` for all text
3. **Logical properties** - Use Start/End instead of Left/Right
4. **Context-aware layouts** - Use `I18nManager.isRTL` for all directional decisions
5. **Consistent imports** - Import `I18nManager` in every component that needs it

Following these principles ensures a native-feeling, properly aligned RTL experience for Arabic users.
