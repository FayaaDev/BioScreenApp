# React Native UI Library Integration

## Overview

The Wix React Native UI Library has been successfully integrated into your BioScreenMobile app while maintaining your existing color scheme and typography.

## What's Been Configured

### Colors
All your existing colors from `constants/Colors.ts` have been mapped to the UI Library's color system:
- **Primary colors**: Your cyan/teal theme (#4CCCE6)
- **Primary shades**: All 7 shades are available
- **Secondary colors**: Your dark backgrounds (#202221)
- **Text colors**: Your existing text and textSecondary colors
- **Semantic colors**: Success, error, warning, info

### Typography
Your Readex Pro font family is configured across all typography variants:
- heading, h1-h6
- body, bodySmall, caption
- button

### Spacings
Standard 8pt grid system (s1-s10) for consistent spacing.

## Usage Examples

### Basic Components

```tsx
import { View, Text, Button, Card } from 'react-native-ui-lib';

// Simple button with primary color
<Button label="Submit" backgroundColor="primary" />

// Text with typography variant
<Text h1 color="text">Welcome</Text>
<Text body color="textSecondary">This is body text</Text>

// Card with surface color
<Card padding-s4 backgroundColor="surface">
  <Text h3>Card Title</Text>
  <Text bodySmall>Card content</Text>
</Card>
```

### Layout with Spacing

```tsx
import { View, Text } from 'react-native-ui-lib';

<View padding-s4 marginB-s3>
  <Text h2 marginB-s2>Title</Text>
  <Text body>Content with consistent spacing</Text>
</View>
```

### Colors in Components

```tsx
import { View, Text, Button } from 'react-native-ui-lib';

// Use your custom colors
<Button label="Primary Action" backgroundColor="primary" />
<Button label="Secondary" backgroundColor="secondary" />
<Text color="primary">Colored text</Text>
<View backgroundColor="card" padding-s5>
  <Text color="text">Card content</Text>
</View>
```

### Input Fields

```tsx
import { TextField } from 'react-native-ui-lib';

<TextField
  placeholder="Enter text"
  floatingPlaceholder
  color="text"
  placeholderTextColor="textSecondary"
  fieldStyle={{ borderBottomColor: 'primary' }}
/>
```

### Gradients

```tsx
import { View, Text, Colors } from 'react-native-ui-lib';
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={[Colors.gradientStart, Colors.gradientEnd]}
  style={{ padding: 16 }}
>
  <Text color="white">Gradient Background</Text>
</LinearGradient>
```

### Available Color Keys

You can use these color keys in any UI Library component:
- `primary`, `primaryAlpha`
- `primary10` through `primary80` (shades)
- `secondary`, `secondary10`, `secondary20`
- `background`, `surface`, `card`
- `text`, `textSecondary`
- `tint`, `icon`
- `gradientStart`, `gradientEnd`
- `success`, `error`, `warning`, `info`
- `grey10` through `grey80`
- `white`, `black`, `transparent`

### Typography Variants

Available typography props:
- `heading` - 36px bold
- `h1` - 32px bold
- `h2` - 28px semibold
- `h3` - 24px semibold
- `h4` - 20px medium
- `h5` - 18px medium
- `h6` - 16px medium
- `body` - 16px regular
- `bodySmall` - 14px regular
- `caption` - 12px regular

### Spacing Values

Use these spacing modifiers:
- `s1` - 4px
- `s2` - 8px
- `s3` - 12px
- `s4` - 16px
- `s5` - 20px
- `s6` - 24px
- `s7` - 28px
- `s8` - 32px
- `s9` - 36px
- `s10` - 40px

Apply as: `padding-s4`, `marginB-s3`, `marginH-s5`, etc.

## Theme Switching

The configuration automatically updates when the color scheme changes between light and dark mode. The `useColorScheme` hook and `useEffect` in `_layout.tsx` handle this.

## Documentation

For more components and features, visit:
- [Official Documentation](https://wix.github.io/react-native-ui-lib/)
- [Component Gallery](https://wix.github.io/react-native-ui-lib/docs/getting-started/components)

## Migration Tips

1. **Gradual Migration**: You don't need to replace all components at once. The library works alongside your existing components.

2. **Import Strategy**: Import only what you need:
   ```tsx
   import { View, Text, Button } from 'react-native-ui-lib';
   ```

3. **Modifiers**: UI Library uses prop-based styling which is very powerful:
   ```tsx
   <View flex padding-s4 backgroundColor="surface" />
   ```

4. **Custom Components**: You can still use your custom components. The library complements them.

## Configuration File

The configuration is in `/lib/uiLibConfig.ts`. It's automatically initialized in `app/_layout.tsx` and updates when the color scheme changes.
