import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { Colors } from 'react-native-ui-lib';

export default function BlurTabBarBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background }]} />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
