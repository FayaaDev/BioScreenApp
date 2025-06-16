import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useScreeningNotifications } from './useScreeningNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook to automatically manage screening notifications based on user preferences
 * This runs in the background and schedules/cancels notifications as needed
 */
export const useAutoNotifications = (screenings?: any[]) => {
  const { hasPermission } = useNotifications();
  const { smartScheduleForScreening, cancelScreeningNotifications } = useScreeningNotifications();

  useEffect(() => {
    if (!screenings || screenings.length === 0) return;

    const manageNotifications = async () => {
      try {
        // Check if user has enabled notifications
        const notificationsEnabled = await AsyncStorage.getItem('notifications_enabled');
        
        if (notificationsEnabled === 'true' && hasPermission) {
          // Schedule notifications only for screenings that are due
          for (const screening of screenings) {
            if (screening.status !== 'completed') {
              const nextDueDate = new Date(screening.nextDue);
              const now = new Date();
              
              // Only schedule if the screening is due within the next 30 days
              if (nextDueDate > now && nextDueDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
                await smartScheduleForScreening({
                  id: screening.id.toString(),
                  name: screening.screening?.name || 'فحص طبي',
                  status: screening.status,
                  nextDue: screening.nextDue,
                  frequencyYears: screening.screening?.frequencyYears || 0,
                });
              } else {
                // Cancel notifications for screenings that are not due
                await cancelScreeningNotifications(screening.id.toString());
              }
            }
          }
        } else {
          // Cancel all notifications if disabled
          for (const screening of screenings) {
            await cancelScreeningNotifications(screening.id.toString());
          }
        }
      } catch (error) {
        console.error('Error managing auto notifications:', error);
      }
    };

    manageNotifications();
  }, [screenings, hasPermission]);

  return null; // This hook doesn't return anything, it just manages notifications
};

export default useAutoNotifications;
