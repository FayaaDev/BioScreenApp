import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface PhoneNumberInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  isRTL?: boolean;
  required?: boolean;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChangeText,
  error,
  label = 'رقم الجوال (WhatsApp)',
  placeholder = 'xxxxxxxxx',
  isRTL = true,
  required = true,
  style,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Memoize the onChangeText callback to prevent unnecessary re-renders
  const handleChange = useCallback((newValue: string) => {
    onChangeText(newValue);
  }, [onChangeText]);

  useEffect(() => {
    // Extract just the 9 digits from the full phone number
    if (value) {
      let cleanValue = value.replace(/[^\d+]/g, '');
      
      // Extract digits after +966
      if (cleanValue.startsWith('+966')) {
        const digits = cleanValue.substring(4);
        setDisplayValue(digits);
      } else if (cleanValue.startsWith('966')) {
        const digits = cleanValue.substring(3);
        setDisplayValue(digits);
      } else if (cleanValue.startsWith('0') && cleanValue.length === 10) {
        // Handle local format like 0501234567
        const digits = cleanValue.substring(1);
        setDisplayValue(digits);
        handleChange('+966' + digits);
      } else if (cleanValue.length === 9 && /^\d{9}$/.test(cleanValue)) {
        // Handle 9-digit number without prefix
        setDisplayValue(cleanValue);
        handleChange('+966' + cleanValue);
      } else if (cleanValue.length > 0) {
        // For other cases, try to extract valid digits
        const digits = cleanValue.replace(/[^\d]/g, '').slice(-9);
        setDisplayValue(digits);
        if (digits.length > 0) {
          handleChange('+966' + digits);
        }
      }
    } else {
      setDisplayValue('');
      if (required) {
        handleChange('+966');
      }
    }
  }, [value, required, handleChange]);

  const handleTextChange = (text: string) => {
    // Only allow digits and limit to 9 characters
    const cleanText = text.replace(/[^\d]/g, '').substring(0, 9);
    
    setDisplayValue(cleanText);
    
    // Always prepend +966 to the digits
    const fullPhoneNumber = '+966' + cleanText;
    onChangeText(fullPhoneNumber);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, isRTL && { textAlign: 'right', alignSelf: 'flex-end' }]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={[
        styles.phoneInputContainer,
        error && styles.inputError
      ]}>
        {/* Country code box - greyed out and non-editable */}
        <View style={styles.countryCodeContainer}>
          <Text style={styles.countryCodeText}>+966</Text>
        </View>
        
        {/* Separator */}
        <View style={styles.separator} />
        
        {/* Phone number input box */}
        <TextInput
          style={[
            styles.phoneInput,
            isRTL && { textAlign: 'right', writingDirection: 'rtl' },
            style,
          ]}
          value={displayValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={9}
          {...props}
        />
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      <Text style={styles.helpText}>
        
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEDEE',
    marginBottom: 8,
    fontFamily: 'ReadexPro',
  },
  required: {
    color: '#ef4444',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    backgroundColor: '#2E3130',
    height: 50,
  },
  countryCodeContainer: {
    backgroundColor: '#202221',
    paddingHorizontal: 12,
    paddingVertical: 15,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 1,
    borderRightColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
    fontFamily: 'ReadexPro',
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: '#555',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#ECEDEE',
    fontFamily: 'ReadexPro',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#2E3130',
    color: '#ECEDEE',
    fontFamily: 'ReadexPro',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'right',
    fontFamily: 'ReadexPro',
  },
  helpText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
    fontFamily: 'ReadexPro',
  },
});

export const validatePhoneNumber = (phoneNumber: string): string | null => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return 'الرجاء إدخال رقم الهاتف';
  }

  // Remove all non-digit characters except +
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check if it starts with +966
  if (!cleanNumber.startsWith('+966')) {
    return 'يجب أن يبدأ رقم الهاتف بـ +966';
  }

  // Check if it has exactly 9 digits after +966
  const digitsAfterPrefix = cleanNumber.substring(4);
  if (digitsAfterPrefix.length !== 9) {
    if (digitsAfterPrefix.length < 9) {
      return `الرجاء إدخال ${9 - digitsAfterPrefix.length} أرقام إضافية`;
    } else {
      return 'رقم الهاتف طويل جداً';
    }
  }

  // Check if all characters after +966 are digits
  if (!/^\d{9}$/.test(digitsAfterPrefix)) {
    return 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
  }

  // Additional validation for Saudi phone numbers
  const firstDigit = digitsAfterPrefix[0];
  if (!['5', '9'].includes(firstDigit)) {
    return 'رقم الهاتف السعودي يجب أن يبدأ برقم 5 أو 9 بعد 966';
  }

  return null; // Valid
};
