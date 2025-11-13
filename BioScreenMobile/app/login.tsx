import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  I18nManager,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { LoginResponse, User } from '../types/api';

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    let isValid = true;

    // Email validation
    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginFormData) => {
      // Normalize email: trim whitespace, convert to lowercase, remove RTL markers
      const normalizedEmail = credentials.email
        .trim()
        .toLowerCase()
        .replace(/[\u200E\u200F\u202A-\u202E]/g, ''); // Remove RTL/LTR marks
      
      return apiRequest<LoginResponse>('POST', '/api/users/login', {
        ...credentials,
        email: normalizedEmail,
      });
    },
    onSuccess: async (data) => {
      try {
        // Store auth token
        if (data.token) {
          await AsyncStorage.setItem('auth_token', data.token);
        } else {
          await AsyncStorage.removeItem('auth_token');
        }
        // Store user ID
        await AsyncStorage.setItem('healthscreen_user_id', data.user.id.toString());
        
        showToast({
          title: 'تم تسجيل الدخول بنجاح',
          description: `مرحباً ${data.user.name}`,
          type: 'success',
        });
        
        // Redirect based on user role
        if (data.user.isAdmin) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Failed to store user data:', error);
        Alert.alert(
          'خطأ',
          'حدث خطأ أثناء حفظ بيانات المستخدم. يرجى المحاولة مرة أخرى.'
        );
      }
    },
    onError: (error: any) => {
      showToast({
        title: 'خطأ في تسجيل الدخول',
        description: error.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        type: 'error',
      });
    },
  });

  const handleSubmit = () => {
    if (validateForm()) {
      loginMutation.mutate(formData);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>تسجيل الدخول</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>البريد الإلكتروني</Text>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: 'right', writingDirection: 'rtl' },
                  errors.email && styles.inputError
                ]}
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                placeholder="أدخل البريد الإلكتروني"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loginMutation.isPending}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>كلمة المرور</Text>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: 'right', writingDirection: 'rtl' },
                  errors.password && styles.inputError
                ]}
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({ ...formData, password: text });
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="#999"
                secureTextEntry
                textContentType="password"
                editable={!loginMutation.isPending}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loginMutation.isPending && styles.loginButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => router.push('/onboarding')}
              disabled={loginMutation.isPending}
            >
              <Text style={styles.signupButtonText}>التسجيل</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202221',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#2E3130',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CCCE6',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: '#ECEDEE',
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#202221',
    color: '#ECEDEE',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '#4CCCE6',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#374151',
    fontSize: 16,
  },
}); 