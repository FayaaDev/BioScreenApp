import { useNotifications } from '../context/NotificationContext';
import { useQuickNotifications } from './useQuickNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook to integrate notifications with the existing screening system
 * This will automatically schedule reminders based on screening status and due dates
 * 
 * NOTE: NOTIFICATIONS DISABLED - All notification functions return early
 */
export const useScreeningNotifications = () => {
  const { hasPermission, cancelNotification } = useNotifications();
  const { schedulePeriodicScreening, scheduleReminderIn } = useQuickNotifications();

  /**
   * Schedule automatic reminders for a screening based on its status and due date
   * DISABLED: Returns empty array without scheduling
   */
  const scheduleScreeningNotifications = async (screening: {
    id: string;
    name: string;
    status: 'due' | 'later' | 'overdue' | 'completed';
    nextDue?: string;
    frequencyYears?: number;
  }) => {
    // NOTIFICATIONS DISABLED - Return early
    console.log('📵 Notifications disabled - skipping scheduling for:', screening.name);
    return [];
  };

  /**
   * Cancel all notifications for a specific screening (e.g., when marked as completed)
   * DISABLED: Returns true without cancelling
   */
  const cancelScreeningNotifications = async (screeningId: string) => {
    // NOTIFICATIONS DISABLED - Return early
    console.log('📵 Notifications disabled - skipping cancellation for screening:', screeningId);
    return true;
  };

  /**
   * Schedule periodic reminders for completed screenings that need to be repeated
   * DISABLED: Returns empty array without scheduling
   */
  const schedulePeriodicScreeningReminders = async (screening: {
    id: string;
    name: string;
    frequencyYears: number;
    lastCompleted: string;
  }) => {
    // NOTIFICATIONS DISABLED - Return early
    console.log('📵 Notifications disabled - skipping periodic scheduling for:', screening.name);
    return [];
  };

  /**
   * Get all scheduled notifications for a specific screening
   * DISABLED: Returns empty arrays
   */
  const getScheduledNotificationsForScreening = async (screeningId: string) => {
    // NOTIFICATIONS DISABLED - Return empty arrays
    console.log('📵 Notifications disabled - no scheduled notifications for screening:', screeningId);
    return { immediate: [], periodic: [] };
  };

  /**
   * Smart scheduler that automatically determines the best notification strategy
   * based on screening status, due date, and user preferences
   * DISABLED: Returns empty arrays without scheduling
   */
  const smartScheduleForScreening = async (screening: {
    id: string;
    name: string;
    status: 'due' | 'later' | 'overdue' | 'completed';
    nextDue?: string;
    frequencyYears?: number;
    lastCompleted?: string;
  }) => {
    // NOTIFICATIONS DISABLED - Return early
    console.log('📵 Notifications disabled - skipping smart scheduling for:', screening.name);
    return {
      immediate: [] as string[],
      periodic: [] as string[],
    };
  };

  return {
    scheduleScreeningNotifications,
    cancelScreeningNotifications,
    schedulePeriodicScreeningReminders,
    getScheduledNotificationsForScreening,
    smartScheduleForScreening,
  };
};

export default useScreeningNotifications;
