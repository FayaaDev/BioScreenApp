import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabBarBackground() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors[theme].card }]} />;
}

export function useBottomTabOverflow() {
  return 0;
}
