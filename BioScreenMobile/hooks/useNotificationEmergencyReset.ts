import { useNotifications } from '../context/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * Emergency function to clear all notifications and reset the system
 */
export const useNotificationEmergencyReset = () => {
  const { cancelAllNotifications } = useNotifications();

  const emergencyReset = async () => {
    try {
      console.log('🚨 EMERGENCY RESET: Clearing all notifications...');
      
      // Cancel all scheduled notifications
      await cancelAllNotifications();
      
      // Clear all notification-related storage
      const keys = await AsyncStorage.getAllKeys();
      const notificationKeys = keys.filter(key => 
        key.includes('notification') || 
        key.includes('screening_notifications') ||
        key.includes('periodic_notifications')
      );
      
      if (notificationKeys.length > 0) {
        await AsyncStorage.multiRemove(notificationKeys);
        console.log(`🧹 Cleared ${notificationKeys.length} notification storage keys`);
      }
      
      console.log('✅ Emergency reset complete');
      
      Alert.alert(
        'Notifications Reset',
        'All notifications have been cleared. The app will reschedule appropriate notifications based on your current screenings.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Error during emergency reset:', error);
      Alert.alert('Error', 'Failed to reset notifications. Please try restarting the app.');
    }
  };

  return { emergencyReset };
};

export default useNotificationEmergencyReset;
