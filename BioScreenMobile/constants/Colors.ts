/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#4CCCE6';
const tintColorDark = '#52E1FEE5';

export const Colors = {
  light: {
    text: '#ECEDEE',
    background: '#202221',
    tint: tintColorLight,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorLight,
    primary: '#4CCCE6',
    primaryAlpha: '#52E1FEE5',
    primaryShades: {
      main: '#4CCCE6',
      shade1: '#23AFD0',
      shade2: '#00A2C7',
      shade3: '#11809C',
      shade4: '#12677E',
      shade5: '#045468',
      shade6: '#003848',
      shade7: '#004558',
    },
    secondary: '#202221',
    secondaryShades: {
      main: '#202221',
      shade1: '#272A29',
    },
    card: '#2E3130',
    textSecondary: '#94a3b8',
    // Gradient colors for headers
    gradientStart: '#003848',
    gradientEnd: '#4CCCE6',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#4CCCE6',
    primaryAlpha: '#52E1FEE5',
    primaryShades: {
      main: '#4CCCE6',
      shade1: '#23AFD0',
      shade2: '#00A2C7',
      shade3: '#11809C',
      shade4: '#12677E',
      shade5: '#045468',
      shade6: '#003848',
      shade7: '#004558',
    },
    secondary: '#202221',
    secondaryShades: {
      main: '#202221',
      shade1: '#272A29',
    },
    card: '#1e293b',
    textSecondary: '#94a3b8',
    // Gradient colors for headers in dark mode
    gradientStart: '#202221',
    gradientEnd: '#272A29',
  },
};
