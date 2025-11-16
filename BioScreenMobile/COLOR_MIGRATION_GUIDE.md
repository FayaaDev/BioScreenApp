# Migration Guide: Using UI Library Colors

## Overview

Your color system is now unified between:
- **Web (Tailwind CSS)**: `/tailwind.config.ts`
- **Mobile (React Native UI Library)**: `/BioScreenMobile/lib/uiLibConfig.ts`
- **Mobile (Constants)**: `/BioScreenMobile/constants/Colors.ts`

All three sources now use the **same exact color values** for consistency.

## How to Use Colors in Components

### Option 1: Direct UI Library Import (Recommended)

```tsx
import { View, Text, Colors } from 'react-native-ui-lib';

function MyComponent() {
  return (
    <View backgroundColor={Colors.primary}>
      <Text color={Colors.text}>Hello World</Text>
    </View>
  );
}
```

### Option 2: Using Color String Names

```tsx
import { View, Text } from 'react-native-ui-lib';

function MyComponent() {
  return (
    <View backgroundColor="primary">
      <Text color="text">Hello World</Text>
    </View>
  );
}
```

### Option 3: Traditional Approach (Still Works)

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

function MyComponent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={{ backgroundColor: colors.primary }}>
      <Text style={{ color: colors.text }}>Hello World</Text>
    </View>
  );
}
```

## Available Color Keys

### Primary Colors
- `primary` - Main brand color (#4CCCE6)
- `primaryAlpha` - Primary with transparency (#52E1FEE5)
- `primary10` through `primary80` - Primary color shades (from darkest to lightest)

### Secondary Colors
- `secondary` - Secondary background (#202221)
- `secondary10`, `secondary20` - Secondary shades

### Background & Surfaces
- `background` - Main background color
- `surface` - Surface/container background
- `card` - Card background

### Text Colors
- `text` - Primary text color (#ECEDEE)
- `textSecondary` - Secondary/muted text (#94a3b8)

### UI Elements
- `tint` - Tint color for selected states
- `icon` - Icon color (#9BA1A6)

### Gradients
- `gradientStart` - Gradient start color
- `gradientEnd` - Gradient end color

### Semantic Colors
- `success` - Success state (#10b981)
- `error` - Error state (#ef4444)
- `warning` - Warning state (#f59e0b)
- `info` - Info state (uses primary)

### Neutral/Grey Scale
- `grey10` through `grey80` - Grey color palette
- `white`, `black`, `transparent`

## Migration Examples

### Before (Old Style)
```tsx
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    padding: 16,
  },
  title: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
});
```

### After (UI Library Style)
```tsx
import { View, Text } from 'react-native-ui-lib';

function MyComponent() {
  return (
    <View backgroundColor="card" padding-s4>
      <Text h1 color="text">Title</Text>
      <Text body color="textSecondary">Description</Text>
    </View>
  );
}
```

## Benefits of Using UI Library Colors

1. **Consistency**: Same colors across web and mobile
2. **Less Code**: No need for StyleSheet.create for simple styles
3. **Modifiers**: Use props like `padding-s4`, `marginB-s3` for consistent spacing
4. **Typography**: Built-in text styles (`h1`, `h2`, `body`, etc.)
5. **Theme Support**: Automatically updates when theme changes
6. **Type Safety**: Better autocomplete and error detection

## Component-Specific Examples

### Buttons
```tsx
import { Button } from 'react-native-ui-lib';

<Button label="Submit" backgroundColor="primary" />
<Button label="Cancel" backgroundColor="secondary" />
<Button label="Delete" backgroundColor="error" />
```

### Cards
```tsx
import { Card, Text } from 'react-native-ui-lib';

<Card backgroundColor="card" padding-s4 marginB-s3>
  <Text h3 color="text">Card Title</Text>
  <Text body color="textSecondary">Card content</Text>
</Card>
```

### Text Inputs
```tsx
import { TextField } from 'react-native-ui-lib';

<TextField
  placeholder="Enter text"
  color="text"
  placeholderTextColor="textSecondary"
  floatingPlaceholderColor="primary"
/>
```

### Gradients
```tsx
import { View, Colors } from 'react-native-ui-lib';
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={[Colors.gradientStart, Colors.gradientEnd]}
  style={{ padding: 16 }}
>
  <Text color="white">Gradient Background</Text>
</LinearGradient>
```

## Web (Tailwind) Usage

In your web components, use the Tailwind classes:

```tsx
<div className="bg-zimam-primary text-white">
  <h1 className="text-zimam-100">Title</h1>
</div>
```

Available Tailwind classes:
- `bg-zimam-primary`, `text-zimam-primary`
- `bg-zimam-50` through `bg-zimam-700` (primary shades)
- `bg-zimamdark-primary`, `bg-zimamdark-secondary`

## Updating Existing Components

You don't need to update everything at once. The old `Colors` constant still works! You can:

1. **Keep using the old approach** - Everything still works
2. **Gradually migrate** - Update components as you work on them
3. **Mix both approaches** - Use UI Library for new components, keep old code as-is

## Best Practices

1. **For new components**: Use UI Library components and colors
2. **For existing components**: Update gradually or keep as-is
3. **For shared logic**: Import from `@/constants/Colors` (works everywhere)
4. **For web**: Use Tailwind classes
5. **For complex styles**: Combine UI Library modifiers with StyleSheet when needed

## Color Consistency Guarantee

All three color sources (Tailwind, UI Library, Colors.ts) now share the exact same hex values. This means:
- `Colors.light.primary` = `UILibColors.primary` = Tailwind's `zimam-primary` = `#4CCCE6`
- Any color changes need to be updated in all three places for consistency
