import { View, StyleSheet } from 'react-native';

export default function TabBarBackground() {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background }]} />;
}

export function useBottomTabOverflow() {
  return 0;
}
