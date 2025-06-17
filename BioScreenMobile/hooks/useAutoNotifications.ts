import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useScreeningNotifications } from './useScreeningNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shouldScheduleNotifications, getNotificationReason, ScreeningData } from '../lib/notificationUtils';

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
        let notificationsEnabled = await AsyncStorage.getItem('notifications_enabled');
        
        // If not set, enable by default for users with due/overdue screenings
        if (notificationsEnabled === null) {
          const hasDueOrOverdue = screenings.some(s => s.status === 'due' || s.status === 'overdue');
          if (hasDueOrOverdue) {
            await AsyncStorage.setItem('notifications_enabled', 'true');
            notificationsEnabled = 'true';
            console.log('🔔 Auto-enabled notifications due to due/overdue screenings');
          }
        }
        
        // Check if we've already processed these screenings recently
        const lastProcessed = await AsyncStorage.getItem('last_notification_processing');
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        if (lastProcessed && (now - parseInt(lastProcessed)) < oneHour) {
          console.log('⏭️ Skipping notification processing - done recently');
          return;
        }
        
        if (notificationsEnabled === 'true' && hasPermission) {
          console.log(`🔔 Auto-scheduling notifications for ${screenings.length} screenings`);
          
          // Schedule notifications for screenings based on their status
          for (const screening of screenings) {
            if (screening.status !== 'completed') {
              const screeningData: ScreeningData = {
                id: screening.id.toString(),
                name: screening.screening?.name || 'فحص طبي',
                status: screening.status,
                nextDue: screening.nextDue,
                frequencyYears: screening.screening?.frequencyYears || 0,
              };
              
              const shouldSchedule = shouldScheduleNotifications(screeningData);
              const reason = getNotificationReason(screeningData);
              
              console.log(`📋 ${screeningData.name}: ${reason}`);

              if (shouldSchedule) {
                console.log(`✅ Scheduling notifications for ${screeningData.name}`);
                await smartScheduleForScreening(screeningData);
              } else {
                console.log(`❌ Canceling notifications for ${screeningData.name}`);
                await cancelScreeningNotifications(screeningData.id);
              }
            }
          }
          
          // Update the last processed time
          await AsyncStorage.setItem('last_notification_processing', now.toString());
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
