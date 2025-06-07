import { useCallback } from 'react';
import Toast from 'react-native-toast-message';

interface ToastOptions {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

export const useToast = () => {
  const showToast = useCallback(({ title, description, type = 'info' }: ToastOptions) => {
    Toast.show({
      type,
      text1: title,
      text2: description,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
    });
  }, []);

  return { showToast };
}; 