import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  I18nManager,
  Alert,
} from 'react-native';
import { View, Text, Card, Button, TextField } from 'react-native-ui-lib';
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
      style={{ flex: 1, backgroundColor: '#202221' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card padding-s5 backgroundColor="#2E3130" enableShadow elevation={3}>
          <View center marginB-s6>
            <Image
              source={require('../assets/logo.png')}
              style={{ width: 64, height: 64, marginBottom: 16 }}
              resizeMode="contain"
            />
            <Text h3 color="primary" style={{ fontFamily: 'ReadexPro-Bold' }}>تسجيل الدخول</Text>
          </View>

          <View style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text body color="text" style={{ fontFamily: 'ReadexPro-SemiBold' }}>البريد الإلكتروني</Text>
              <RNTextInput
                style={[
                  { height: 48, borderWidth: 1, borderColor: '#555', borderRadius: 8, paddingHorizontal: 12, fontSize: 16, fontFamily: 'ReadexPro', backgroundColor: '#202221', color: '#ECEDEE' },
                  errors.email && { borderColor: '#ef4444' }
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
                <Text bodySmall color="error" style={{ fontFamily: 'ReadexPro', marginTop: 4 }}>{errors.email}</Text>
              )}
            </View>

            <View style={{ gap: 8 }}>
              <Text body color="text" style={{ fontFamily: 'ReadexPro-SemiBold' }}>كلمة المرور</Text>
              <RNTextInput
                style={[
                  { height: 48, borderWidth: 1, borderColor: '#555', borderRadius: 8, paddingHorizontal: 12, fontSize: 16, fontFamily: 'ReadexPro', backgroundColor: '#202221', color: '#ECEDEE' },
                  errors.password && { borderColor: '#ef4444' }
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
                <Text bodySmall color="error" style={{ fontFamily: 'ReadexPro', marginTop: 4 }}>{errors.password}</Text>
              )}
            </View>

            <Button
              label="تسجيل الدخول"
              backgroundColor="#045468"
              disabled={loginMutation.isPending}
              onPress={handleSubmit}
              style={{ marginTop: 8, opacity: loginMutation.isPending ? 0.7 : 1 }}
            >
              {loginMutation.isPending && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
            </Button>

            <TouchableOpacity
              style={{ marginTop: 16, alignItems: 'center' }}
              onPress={() => router.push('/onboarding')}
              disabled={loginMutation.isPending}
            >
              <Text body color="text" style={{ fontFamily: 'ReadexPro' }}>التسجيل</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}