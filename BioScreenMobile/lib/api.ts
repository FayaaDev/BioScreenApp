import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { ApiError } from '../types/api';

// Get the API URL from environment variables or use a default
const getApiBaseUrl = () => {
  // Check for environment variable from Expo
  const envApiUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
  
  if (envApiUrl) {
    console.log('Using API URL from environment:', envApiUrl);
    return envApiUrl;
  }
  
  // Check if we're in development mode
  if (__DEV__) {
    console.log('Development mode: using local fallback');
    return 'http://localhost:5000'; // Use localhost for development
  }
  
  // Production fallback - use your domain with HTTPS
  console.log('Production mode: using production fallback');
  return 'https://bakkerapp.com';
};

const API_BASE_URL = getApiBaseUrl();

// Test connectivity function
export const testConnectivity = async (): Promise<boolean> => {
  try {
    console.log('Testing connectivity to:', API_BASE_URL);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('Connectivity test response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.text();
      console.log('Server response:', data);
    }
    
    return response.ok;
  } catch (error: any) {
    console.error('Connectivity test failed:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      cause: error?.cause,
    });
    return false;
  }
};

export const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<T> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making API request to:', url);
    console.log('Request method:', method);
    console.log('Request data:', data);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }

    console.log('Request headers:', headers);

    // Add timeout to the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const responseData = await response.json();

    if (!response.ok) {
      const error = responseData as ApiError;
      console.error('API error response:', error);
      throw new Error(error.message || 'An error occurred');
    }

    return responseData as T;
  } catch (error) {
    console.error('API request failed:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    if (error instanceof TypeError) {
      if (error.message.includes('Network request failed')) {
        console.error('Network error details:', {
          url: `${API_BASE_URL}${endpoint}`,
          method,
          message: error.message,
          stack: error.stack
        });
        throw new Error(`Network error: Unable to reach server at ${API_BASE_URL}. Please check your internet connection and server status.`);
      }
      if (error.message.includes('aborted')) {
        throw new Error('Request timeout: The server took too long to respond.');
      }
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('An unknown error occurred');
  }
};

// Debug function to test different aspects of connectivity
export const debugNetworkIssue = async (): Promise<void> => {
  console.log('=== NETWORK DEBUG START ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  
  // Test 1: Basic connectivity
  console.log('Test 1: Basic connectivity test');
  const connectivityResult = await testConnectivity();
  console.log('Connectivity test result:', connectivityResult);
  
  // Test 2: Simple fetch to Google (to verify internet connection)
  console.log('Test 2: Internet connectivity test');
  try {
    const googleResponse = await fetch('https://www.google.com', {
      method: 'HEAD',
      cache: 'no-cache'
    });
    console.log('Google connectivity:', googleResponse.ok ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.log('Google connectivity: FAILED -', error);
  }
  
  // Test 3: Try different endpoints on your server
  console.log('Test 3: Testing different server endpoints');
  const endpoints = ['/api/health', '/api/users', '/'];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`${endpoint}: Status ${response.status} - ${response.ok ? 'OK' : 'FAILED'}`);
    } catch (error) {
      console.log(`${endpoint}: FAILED -`, error);
    }
  }
  
  console.log('=== NETWORK DEBUG END ===');
};