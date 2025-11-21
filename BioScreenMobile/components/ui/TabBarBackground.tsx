import { View, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function TabBarBackground() {
  const colorScheme = useColorScheme();
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors[colorScheme ?? 'light'].background }]} />;
}

export function useBottomTabOverflow() {
  return 0;
}
