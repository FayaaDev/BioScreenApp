import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useScreeningNotifications } from './useScreeningNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shouldScheduleNotifications, getNotificationReason, ScreeningData, cancelOverdueNotifications } from '../lib/notificationUtils';

/**
 * Hook to automatically manage screening notifications based on user preferences
 * This runs in the background and schedules/cancels notifications as needed
 * 
 * NOTE: NOTIFICATIONS DISABLED - This hook returns early without processing
 */
export const useAutoNotifications = (screenings?: any[]) => {
  const { hasPermission } = useNotifications();
  const { smartScheduleForScreening, cancelScreeningNotifications } = useScreeningNotifications();

  useEffect(() => {
    // NOTIFICATIONS DISABLED - Return early without processing
    console.log('� Auto-notifications disabled - skipping notification management');
    return;
  }, [screenings, hasPermission, smartScheduleForScreening, cancelScreeningNotifications]);

  return null; // This hook doesn't return anything, it just manages notifications
};

export default useAutoNotifications;
