import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';

export default function TabBarBackground() {
  const { isDark } = useTheme();
  const theme = isDark ? 'dark' : 'light';
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors[theme].tabBarBackground }]} />;
}

export function useBottomTabOverflow() {
  return 0;
}
