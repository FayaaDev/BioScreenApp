import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TestInputWithTooltipProps {
  label: string;
  tooltipText: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  [key: string]: any;
}

export function TestInputWithTooltip({
  label,
  tooltipText,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  ...rest
}: TestInputWithTooltipProps) {
  const [showTip, setShowTip] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Tooltip
        isVisible={showTip}
        content={<Text style={styles.tooltipText}>{tooltipText}</Text>}
        placement="top"
        onClose={() => setShowTip(false)}
        showChildInTooltip={false}
        backgroundColor="rgba(0,0,0,0.2)"
      >
        <TouchableOpacity onPress={() => setShowTip(true)} style={styles.infoIcon}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#4CCCE6" />
        </TouchableOpacity>
      </Tooltip>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    color: '#333',
  },
  infoIcon: {
    marginRight: 8,
  },
  tooltipText: {
    fontSize: 14,
    color: '#333',
    maxWidth: 200,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2E3130',
    color: '#ECEDEE',
  },
}); 