/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * 
 * IMPORTANT: These colors are now integrated with React Native UI Library.
 * The UI Library configuration (lib/uiLibConfig.ts) uses these exact values.
 * Any changes here should be reflected in the UI Library config for consistency.
 */

// Radix UI Color Scales (Sage and Cyan)
const radixScales = {
  sageLight: ["#fbfdfc", "#f7f9f8", "#eef1f0", "#e6e9e8", "#dfe2e0", "#d7dad9", "#cbcfcd", "#b8bcba", "#868e8b", "#7c8481", "#5f6563", "#1a211e"],
  cyanLight: ["#fafdfe", "#f2fafb", "#def7f9", "#caf1f6", "#b5e9f0", "#9ddde7", "#7dcedc", "#3db9cf", "#00a2c7", "#0797b9", "#107d98", "#0d3c48"],
  sageDark: ["#101211", "#171918", "#202221", "#272a29", "#2e3130", "#373b39", "#444947", "#5b625f", "#63706b", "#717d79", "#adb5b2", "#eceeed"],
  cyanDark: ["#0b161a", "#101b20", "#082c36", "#003848", "#004558", "#045468", "#12677e", "#11809c", "#00a2c7", "#23afd0", "#4ccce6", "#b6ecf7"]
};

// Helper to get a specific step from a scale (1-based index)
const getStep = (scale: string[], step: number) => scale[step - 1];

// Define the theme structure type
interface ThemeColors {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  primary: string;
  primaryAlpha: string;
  primaryShades: {
    main: string;
    shade1: string;
    shade2: string;
    shade3: string;
    shade4: string;
    shade5: string;
    shade6: string;
    shade7: string;
  };
  secondary: string;
  secondaryShades: {
    main: string;
    shade1: string;
  };
  card: string;
  textSecondary: string;
  gradientStart: string;
  gradientEnd: string;
  headerGradient: [string, string, string]; // 3-color gradient for headers
  success: string;
  error: string;
  warning: string;
  info: string;
  dashboardCardBackground: string;
  overlay: string;
  status: {
    due: { background: string; text: string; border: string; icon: string };
    overdue: { background: string; text: string; border: string; icon: string };
    later: { background: string; text: string; border: string; icon: string };
    completed: { background: string; text: string; border: string; icon: string };
  };
  tabBarBackground: string;
  dashboardStatus: {
    due: string;
    overdue: string;
    later: string;
    completed: string;
  };
  // Container colors - light cyan tinted like website
  container: {
    background: string;
    border: string;
  };
}

export const Colors: {
  light: ThemeColors;
  dark: ThemeColors;
  zimamLight: ThemeColors;
  zimamDark: ThemeColors;
  // Direct access properties for backwards compatibility
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  primary: string;
  primaryAlpha: string;
  primaryShades: ThemeColors['primaryShades'];
  secondary: string;
  secondaryShades: ThemeColors['secondaryShades'];
  card: string;
  textSecondary: string;
  gradientStart: string;
  gradientEnd: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  white: string;
  border: string;
  dashboardCardBackground: string;
  overlay: string;
  status: ThemeColors['status'];
  tabBarBackground: string;
  dashboardStatus: ThemeColors['dashboardStatus'];
  container: ThemeColors['container'];
} = {
  // Legacy Light Theme (mapped to Zimam Light for now)
  light: {
    text: getStep(radixScales.sageLight, 12), // Sage 12
    background: getStep(radixScales.sageLight, 3), // Sage 3
    tint: getStep(radixScales.cyanLight, 9), // Cyan 9
    icon: getStep(radixScales.sageLight, 11), // Sage 11
    tabIconDefault: getStep(radixScales.sageLight, 11),
    tabIconSelected: getStep(radixScales.cyanLight, 9),
    primary: getStep(radixScales.cyanLight, 9),
    primaryAlpha: getStep(radixScales.cyanLight, 9) + 'E5', // Adding alpha
    primaryShades: {
      main: getStep(radixScales.cyanLight, 9),
      shade1: getStep(radixScales.cyanLight, 10),
      shade2: getStep(radixScales.cyanLight, 11),
      shade3: getStep(radixScales.cyanLight, 12), // Darkest
      shade4: getStep(radixScales.cyanLight, 8),
      shade5: getStep(radixScales.cyanLight, 7),
      shade6: getStep(radixScales.cyanLight, 6),
      shade7: getStep(radixScales.cyanLight, 5),
    },
    secondary: getStep(radixScales.sageLight, 3),
    secondaryShades: {
      main: getStep(radixScales.sageLight, 3),
      shade1: getStep(radixScales.sageLight, 4),
    },
    card: getStep(radixScales.sageLight, 4), // Sage 4 for cards
    textSecondary: getStep(radixScales.sageLight, 11),
    gradientStart: getStep(radixScales.cyanLight, 3),
    gradientEnd: getStep(radixScales.cyanLight, 9),
    headerGradient: ['#0e7490', '#0891b2', '#06b6d4'] as [string, string, string], // Cyan gradient for light theme
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: getStep(radixScales.cyanLight, 9),
    dashboardCardBackground: getStep(radixScales.cyanLight, 9), // Bright Blue (Primary)
    overlay: 'rgba(0,0,0,0.5)',
    status: {
      due: { background: '#E3F7F4', text: '#0EB39E', border: '#A1E4DC', icon: '#0EB39E' },
      overdue: { background: '#F4E6DD', text: '#A35829', border: '#E3C8B4', icon: '#A35829' },
      later: { background: 'rgba(0, 0, 0, 0.05)', text: getStep(radixScales.sageLight, 11), border: 'rgba(0, 0, 0, 0.1)', icon: getStep(radixScales.sageLight, 11) },
      completed: { background: '#f0fdf4', text: '#166534', border: '#bbf7d0', icon: '#166534' },
    },
    tabBarBackground: getStep(radixScales.sageLight, 4),
    dashboardStatus: {
      due: '#0c4a6e', // Dark Blue
      overdue: '#D97706', // Yellowish-Brownish (Amber 600)
      later: '#ffffff', // White
      completed: '#15803d', // Dark Green (Green 700) - better contrast on light backgrounds
    },
    container: {
      background: '#f0f9ff', // Light cyan tint like website
      border: '#7dd3fc', // Sky blue border
    },
  },
  // Zimam Dark Theme (Default)
  dark: {
    text: getStep(radixScales.sageDark, 12), // Sage 12
    background: getStep(radixScales.sageDark, 3), // Sage 3
    tint: getStep(radixScales.cyanDark, 7), // Cyan 7 - Darker blue for dark theme
    icon: getStep(radixScales.sageDark, 11), // Sage 11
    tabIconDefault: getStep(radixScales.sageDark, 11),
    tabIconSelected: getStep(radixScales.cyanDark, 7),
    primary: getStep(radixScales.cyanDark, 7), // Changed from 9 to 7 for darker blue
    primaryAlpha: getStep(radixScales.cyanDark, 7) + 'E5',
    primaryShades: {
      main: getStep(radixScales.cyanDark, 7),
      shade1: getStep(radixScales.cyanDark, 8),
      shade2: getStep(radixScales.cyanDark, 9),
      shade3: getStep(radixScales.cyanDark, 10),
      shade4: getStep(radixScales.cyanDark, 6),
      shade5: getStep(radixScales.cyanDark, 5),
      shade6: getStep(radixScales.cyanDark, 4),
      shade7: getStep(radixScales.cyanDark, 3),
    },
    secondary: getStep(radixScales.sageDark, 3),
    secondaryShades: {
      main: getStep(radixScales.sageDark, 3),
      shade1: getStep(radixScales.sageDark, 4),
    },
    card: getStep(radixScales.sageDark, 4), // Sage 4 for cards
    textSecondary: getStep(radixScales.sageDark, 11),
    gradientStart: getStep(radixScales.sageDark, 3),
    gradientEnd: getStep(radixScales.sageDark, 4),
    headerGradient: ['#134e4a', '#0f766e', '#14b8a6'] as [string, string, string], // Teal gradient with more contrast for dark theme
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: getStep(radixScales.cyanDark, 7), // Also updated to match primary
    dashboardCardBackground: getStep(radixScales.cyanDark, 5), // Dark Blue
    overlay: 'rgba(0,0,0,0.7)',
    status: {
      due: { background: 'rgba(14, 179, 158, 0.16)', text: '#0EB39E', border: 'rgba(14, 179, 158, 0.3)', icon: '#0EB39E' },
      overdue: { background: 'rgba(163, 88, 41, 0.16)', text: '#f59e0b', border: 'rgba(163, 88, 41, 0.3)', icon: '#f59e0b' },
      later: { background: 'rgba(255, 255, 255, 0.08)', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.16)', icon: '#FFFFFF' },
      completed: { background: 'rgba(22, 101, 52, 0.2)', text: '#4ade80', border: 'rgba(22, 101, 52, 0.4)', icon: '#4ade80' },
    },
    tabBarBackground: getStep(radixScales.cyanDark, 1),
    dashboardStatus: {
      due: '#22d3ee', // Light Blue
      overdue: '#F59E0B', // Amber 500
      later: '#ffffff', // White
      completed: '#22c55e', // Vibrant Green (Green 500)
    },
    container: {
      background: 'rgba(14, 116, 144, 0.15)', // Dark cyan tint
      border: 'rgba(56, 189, 248, 0.4)', // Cyan border with transparency
    },
  },
  // Explicit Zimam Themes (for future switching logic)
  zimamLight: {
    // Same as light above
    text: getStep(radixScales.sageLight, 12),
    background: getStep(radixScales.sageLight, 3),
    tint: getStep(radixScales.cyanLight, 9),
    icon: getStep(radixScales.sageLight, 11),
    tabIconDefault: getStep(radixScales.sageLight, 11),
    tabIconSelected: getStep(radixScales.cyanLight, 9),
    primary: getStep(radixScales.cyanLight, 9),
    primaryAlpha: getStep(radixScales.cyanLight, 9) + 'E5',
    primaryShades: {
      main: getStep(radixScales.cyanLight, 9),
      shade1: getStep(radixScales.cyanLight, 10),
      shade2: getStep(radixScales.cyanLight, 11),
      shade3: getStep(radixScales.cyanLight, 12),
      shade4: getStep(radixScales.cyanLight, 8),
      shade5: getStep(radixScales.cyanLight, 7),
      shade6: getStep(radixScales.cyanLight, 6),
      shade7: getStep(radixScales.cyanLight, 5),
    },
    secondary: getStep(radixScales.sageLight, 3),
    secondaryShades: {
      main: getStep(radixScales.sageLight, 3),
      shade1: getStep(radixScales.sageLight, 4),
    },
    card: getStep(radixScales.sageLight, 4),
    textSecondary: getStep(radixScales.sageLight, 11),
    gradientStart: getStep(radixScales.cyanLight, 3),
    gradientEnd: getStep(radixScales.cyanLight, 9),
    headerGradient: ['#0e7490', '#0891b2', '#06b6d4'] as [string, string, string], // Cyan gradient for light theme
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: getStep(radixScales.cyanLight, 9),
    dashboardCardBackground: getStep(radixScales.cyanLight, 9),
    overlay: 'rgba(0,0,0,0.5)',
    status: {
      due: { background: '#E3F7F4', text: '#0EB39E', border: '#A1E4DC', icon: '#0EB39E' },
      overdue: { background: '#F4E6DD', text: '#A35829', border: '#E3C8B4', icon: '#A35829' },
      later: { background: 'rgba(0, 0, 0, 0.05)', text: getStep(radixScales.sageLight, 11), border: 'rgba(0, 0, 0, 0.1)', icon: getStep(radixScales.sageLight, 11) },
      completed: { background: '#f0fdf4', text: '#166534', border: '#bbf7d0', icon: '#166534' },
    },
    tabBarBackground: getStep(radixScales.sageLight, 4),
    dashboardStatus: {
      due: '#0c4a6e', // Dark Blue
      overdue: '#D97706', // Yellowish-Brownish (Amber 600)
      later: '#ffffff', // White
      completed: '#15803d', // Dark Green (Green 700) - better contrast on light backgrounds
    },
    container: {
      background: '#f0f9ff', // Light cyan tint like website
      border: '#7dd3fc', // Sky blue border
    },
  },
  zimamDark: {
    // Same as dark above
    text: getStep(radixScales.sageDark, 12),
    background: getStep(radixScales.sageDark, 3),
    tint: getStep(radixScales.cyanDark, 7), // Cyan 7 - Darker blue for dark theme
    icon: getStep(radixScales.sageDark, 11),
    tabIconDefault: getStep(radixScales.sageDark, 11),
    tabIconSelected: getStep(radixScales.cyanDark, 7),
    primary: getStep(radixScales.cyanDark, 7), // Changed from 9 to 7 for darker blue
    primaryAlpha: getStep(radixScales.cyanDark, 7) + 'E5',
    primaryShades: {
      main: getStep(radixScales.cyanDark, 7),
      shade1: getStep(radixScales.cyanDark, 8),
      shade2: getStep(radixScales.cyanDark, 9),
      shade3: getStep(radixScales.cyanDark, 10),
      shade4: getStep(radixScales.cyanDark, 6),
      shade5: getStep(radixScales.cyanDark, 5),
      shade6: getStep(radixScales.cyanDark, 4),
      shade7: getStep(radixScales.cyanDark, 3),
    },
    secondary: getStep(radixScales.sageDark, 3),
    secondaryShades: {
      main: getStep(radixScales.sageDark, 3),
      shade1: getStep(radixScales.sageDark, 4),
    },
    card: getStep(radixScales.sageDark, 4),
    textSecondary: getStep(radixScales.sageDark, 11),
    gradientStart: getStep(radixScales.sageDark, 3),
    gradientEnd: getStep(radixScales.sageDark, 4),
    headerGradient: ['#134e4a', '#0f766e', '#14b8a6'] as [string, string, string], // Teal gradient with more contrast for dark theme
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: getStep(radixScales.cyanDark, 7), // Updated to match primary
    dashboardCardBackground: getStep(radixScales.cyanDark, 5),
    overlay: 'rgba(0,0,0,0.7)',
    status: {
      due: { background: 'rgba(14, 179, 158, 0.16)', text: '#0EB39E', border: 'rgba(14, 179, 158, 0.3)', icon: '#0EB39E' },
      overdue: { background: 'rgba(163, 88, 41, 0.16)', text: '#f59e0b', border: 'rgba(163, 88, 41, 0.3)', icon: '#f59e0b' },
      later: { background: 'rgba(255, 255, 255, 0.08)', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.16)', icon: '#FFFFFF' },
      completed: { background: 'rgba(22, 101, 52, 0.2)', text: '#4ade80', border: 'rgba(22, 101, 52, 0.4)', icon: '#4ade80' },
    },
    tabBarBackground: getStep(radixScales.cyanDark, 1),
    dashboardStatus: {
      due: '#22d3ee', // Light Blue
      overdue: '#F59E0B', // Amber 500
      later: '#ffffff', // White
      completed: '#22c55e', // Vibrant Green (Green 500)
    },
    container: {
      background: 'rgba(14, 116, 144, 0.15)', // Dark cyan tint
      border: 'rgba(56, 189, 248, 0.4)', // Cyan border with transparency
    },
  },
  // Direct access properties (defaulting to light theme initially)
  text: getStep(radixScales.sageLight, 12),
  background: getStep(radixScales.sageLight, 3),
  tint: getStep(radixScales.cyanLight, 9),
  icon: getStep(radixScales.sageLight, 11),
  tabIconDefault: getStep(radixScales.sageLight, 11),
  tabIconSelected: getStep(radixScales.cyanLight, 9),
  primary: getStep(radixScales.cyanLight, 9),
  primaryAlpha: getStep(radixScales.cyanLight, 9) + 'E5',
  primaryShades: {
    main: getStep(radixScales.cyanLight, 9),
    shade1: getStep(radixScales.cyanLight, 10),
    shade2: getStep(radixScales.cyanLight, 11),
    shade3: getStep(radixScales.cyanLight, 12),
    shade4: getStep(radixScales.cyanLight, 8),
    shade5: getStep(radixScales.cyanLight, 7),
    shade6: getStep(radixScales.cyanLight, 6),
    shade7: getStep(radixScales.cyanLight, 5),
  },
  secondary: getStep(radixScales.sageLight, 3),
  secondaryShades: {
    main: getStep(radixScales.sageLight, 3),
    shade1: getStep(radixScales.sageLight, 4),
  },
  card: getStep(radixScales.sageLight, 4),
  textSecondary: getStep(radixScales.sageLight, 11),
  gradientStart: getStep(radixScales.cyanLight, 3),
  gradientEnd: getStep(radixScales.cyanLight, 9),
  headerGradient: ['#0e7490', '#0891b2', '#06b6d4'] as [string, string, string], // Default to light theme
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: getStep(radixScales.cyanLight, 9),
  white: '#ffffff',
  border: '#555555',
  dashboardCardBackground: getStep(radixScales.cyanLight, 9),
  overlay: 'rgba(0,0,0,0.5)',
  status: {
    due: { background: '#E3F7F4', text: '#0EB39E', border: '#A1E4DC', icon: '#0EB39E' },
    overdue: { background: '#F4E6DD', text: '#A35829', border: '#E3C8B4', icon: '#A35829' },
    later: { background: 'rgba(0, 0, 0, 0.05)', text: getStep(radixScales.sageLight, 11), border: 'rgba(0, 0, 0, 0.1)', icon: getStep(radixScales.sageLight, 11) },
    completed: { background: '#f0fdf4', text: '#166534', border: '#bbf7d0', icon: '#166534' },
  },
  tabBarBackground: getStep(radixScales.sageLight, 4),
  dashboardStatus: {
    due: '#0c4a6e',
    overdue: '#D97706',
    later: '#ffffff',
    completed: '#15803d',
  },
  container: {
    background: '#f0f9ff',
    border: '#7dd3fc',
  },
};

/**
 * Helper function to get UI Library Colors
 */
export function getUILibraryColors() {
  try {
    const { Colors: UIColors } = require('react-native-ui-lib');
    return UIColors;
  } catch (error) {
    console.warn('UI Library not loaded, using fallback colors');
    return null;
  }
}

export const UILibColors = getUILibraryColors();



// Export as default for convenience
export default Colors;
