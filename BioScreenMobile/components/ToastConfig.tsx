import React from 'react';
import { View, Text } from 'react-native-ui-lib';
import { I18nManager } from 'react-native';

export const toastConfig = {
  success: ({ text1, text2, props }: any) => (
    <View 
      br40
      padding-s4
      marginH-s4
      marginT-s4
      backgroundColor="primary"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        ...props?.style
      }}
    >
      <Text 
        body
        color="white"
        style={{ 
          fontWeight: '600',
          textAlign: I18nManager.isRTL ? 'right' : 'left',
          ...props?.text1Style
        }}
      >
        {text1}
      </Text>
      {text2 && (
        <Text 
          bodySmall
          color="white"
          marginT-4
          style={{ 
            textAlign: I18nManager.isRTL ? 'right' : 'left',
            ...props?.text2Style
          }}
        >
          {text2}
        </Text>
      )}
    </View>
  ),
  error: ({ text1, text2, props }: any) => (
    <View 
      br40
      padding-s4
      marginH-s4
      marginT-s4
      backgroundColor="error"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        ...props?.style
      }}
    >
      <Text 
        body
        color="white"
        style={{ 
          fontWeight: '600',
          textAlign: I18nManager.isRTL ? 'right' : 'left',
          ...props?.text1Style
        }}
      >
        {text1}
      </Text>
      {text2 && (
        <Text 
          bodySmall
          color="white"
          marginT-4
          style={{ 
            textAlign: I18nManager.isRTL ? 'right' : 'left',
            ...props?.text2Style
          }}
        >
          {text2}
        </Text>
      )}
    </View>
  ),
  info: ({ text1, text2, props }: any) => (
    <View 
      br40
      padding-s4
      marginH-s4
      marginT-s4
      backgroundColor="info"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        ...props?.style
      }}
    >
      <Text 
        body
        color="white"
        style={{ 
          fontWeight: '600',
          textAlign: I18nManager.isRTL ? 'right' : 'left',
          ...props?.text1Style
        }}
      >
        {text1}
      </Text>
      {text2 && (
        <Text 
          bodySmall
          color="white"
          marginT-4
          style={{ 
            textAlign: I18nManager.isRTL ? 'right' : 'left',
            ...props?.text2Style
          }}
        >
          {text2}
        </Text>
      )}
    </View>
  ),
};
