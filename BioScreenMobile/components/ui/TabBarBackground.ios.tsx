import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

export default function BlurTabBarBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#171918' }]} />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
