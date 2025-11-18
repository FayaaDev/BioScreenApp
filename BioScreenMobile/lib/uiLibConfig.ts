import { Colors as AppColors } from '@/constants/Colors';

/**
 * Configure React Native UI Library with the app's existing color scheme
 * This maintains consistency across the app while using UI Library components
 */
export function configureUILibrary(colorScheme: 'light' | 'dark' = 'light') {
  // Import UI Library components dynamically to handle dependencies
  let Colors, Typography, Spacings;
  try {
    const UILib = require('react-native-ui-lib');
    Colors = UILib.Colors;
    Typography = UILib.Typography;
    Spacings = UILib.Spacings;
  } catch (error) {
    console.warn('React Native UI Library not fully loaded:', error);
    return;
  }

  const currentColors = AppColors[colorScheme];

  // Configure colors to match existing theme
  Colors.loadColors({
    // Primary colors - Zimam brand
    primary: currentColors.primary,
    primaryAlpha: currentColors.primaryAlpha,
    'zimam-primary': currentColors.primary,
    'zimam-brand': currentColors.primaryShades.shade5,
    
    // Primary shades
    primary10: currentColors.primaryShades.shade7,
    primary20: currentColors.primaryShades.shade6,
    primary30: currentColors.primaryShades.shade5,
    primary40: currentColors.primaryShades.shade4,
    primary50: currentColors.primaryShades.shade3,
    primary60: currentColors.primaryShades.shade2,
    primary70: currentColors.primaryShades.shade1,
    primary80: currentColors.primaryShades.main,
    
    // Secondary colors
    secondary: currentColors.secondary,
    secondary10: currentColors.secondaryShades.main,
    secondary20: currentColors.secondaryShades.shade1,
    
    // Background and surfaces
    background: currentColors.background,
    surface: currentColors.card,
    card: currentColors.card,
    'bg-dark': '#202221',
    'bg-card': '#2E3130',
    
    // Text colors
    text: currentColors.text,
    textSecondary: currentColors.textSecondary,
    dark10: '#ECEDEE', // Main text color
    dark20: '#999',    // Placeholder text
    dark30: '#888',    // Disabled text
    
    // UI elements
    tint: currentColors.tint,
    icon: currentColors.icon,
    
    // Gradients
    gradientStart: currentColors.gradientStart,
    gradientEnd: currentColors.gradientEnd,
    
    // Common semantic colors
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: currentColors.primary,
    
    // Neutral colors for various use cases
    grey10: '#f9fafb',
    grey20: '#f3f4f6',
    grey30: '#e5e7eb',
    grey40: '#d1d5db',
    grey50: '#9ca3af',
    grey60: '#6b7280',
    grey70: '#4b5563',
    grey80: '#374151',
    
    // Border colors
    border: '#555',
    borderError: '#ef4444',
    
    // Additional utility colors
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  });

  // Configure typography (using Readex Pro font)
  Typography.loadTypographies({
    heading: { fontSize: 36, fontFamily: 'ReadexPro-Bold' },
    h1: { fontSize: 32, fontFamily: 'ReadexPro-Bold' },
    h2: { fontSize: 28, fontFamily: 'ReadexPro-SemiBold' },
    h3: { fontSize: 24, fontFamily: 'ReadexPro-SemiBold' },
    h4: { fontSize: 20, fontFamily: 'ReadexPro-Medium' },
    h5: { fontSize: 18, fontFamily: 'ReadexPro-Medium' },
    h6: { fontSize: 16, fontFamily: 'ReadexPro-Medium' },
    body: { fontSize: 16, fontFamily: 'ReadexPro' },
    bodySmall: { fontSize: 14, fontFamily: 'ReadexPro' },
    caption: { fontSize: 12, fontFamily: 'ReadexPro' },
    button: { fontSize: 16, fontFamily: 'ReadexPro-SemiBold' },
  });

  // Configure spacings (standard 8pt grid)
  Spacings.loadSpacings({
    s1: 4,
    s2: 8,
    s3: 12,
    s4: 16,
    s5: 20,
    s6: 24,
    s7: 28,
    s8: 32,
    s9: 36,
    s10: 40,
  });
}
