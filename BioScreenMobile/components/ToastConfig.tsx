import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { I18nManager } from 'react-native';

export const toastConfig = {
  success: ({ text1, text2, props }: any) => (
    <View style={[styles.container, styles.successContainer, props?.style]}>
      <Text style={[styles.title, props?.text1Style]}>{text1}</Text>
      {text2 && <Text style={[styles.message, props?.text2Style]}>{text2}</Text>}
    </View>
  ),
  error: ({ text1, text2, props }: any) => (
    <View style={[styles.container, styles.errorContainer, props?.style]}>
      <Text style={[styles.title, props?.text1Style]}>{text1}</Text>
      {text2 && <Text style={[styles.message, props?.text2Style]}>{text2}</Text>}
    </View>
  ),
  info: ({ text1, text2, props }: any) => (
    <View style={[styles.container, styles.infoContainer, props?.style]}>
      <Text style={[styles.title, props?.text1Style]}>{text1}</Text>
      {text2 && <Text style={[styles.message, props?.text2Style]}>{text2}</Text>}
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successContainer: {
    backgroundColor: '#008553',
  },
  errorContainer: {
    backgroundColor: '#ef4444',
  },
  infoContainer: {
    backgroundColor: '#3b82f6',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  message: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
}); 