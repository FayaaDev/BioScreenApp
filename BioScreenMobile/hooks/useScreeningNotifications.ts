import { useNotifications } from '../context/NotificationContext';
import { useQuickNotifications } from './useQuickNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook to integrate notifications with the existing screening system
 * This will automatically schedule reminders based on screening status and due dates
 */
export const useScreeningNotifications = () => {
  const { hasPermission } = useNotifications();
  const { schedulePeriodicScreening, scheduleReminderIn } = useQuickNotifications();

  /**
   * Schedule automatic reminders for a screening based on its status and due date
   */
  const scheduleScreeningNotifications = async (screening: {
    id: string;
    name: string;
    status: 'due' | 'later' | 'overdue' | 'completed';
    nextDue?: string;
    frequencyYears?: number;
  }) => {
    if (!hasPermission) {
      console.log('No notification permission, skipping scheduling');
      return [];
    }

    try {
      const identifiers: string[] = [];

      // Check if notifications for this screening are already scheduled
      const existingKey = `screening_notifications_${screening.id}`;
      const existing = await AsyncStorage.getItem(existingKey);
      
      if (existing) {
        console.log(`Notifications already scheduled for screening ${screening.id}`);
        return JSON.parse(existing);
      }

      const now = new Date();

      if (screening.status === 'due') {
        // Schedule immediate reminder (in 5 minutes) and follow-up reminders
        const immediateId = await scheduleReminderIn(
          `${screening.name} Due Now`,
          `Your ${screening.name} screening is due. Schedule your appointment today!`,
          5, // 5 minutes from now
          'screening_reminder'
        );
        if (immediateId) identifiers.push(immediateId);

        // Schedule daily reminders for the next week
        for (let i = 1; i <= 7; i++) {
          const reminderId = await scheduleReminderIn(
            `${screening.name} Reminder`,
            `Don't forget to schedule your ${screening.name} screening - it's overdue!`,
            i * 24 * 60, // Daily reminders
            'screening_reminder'
          );
          if (reminderId) identifiers.push(reminderId);
        }
      } else if (screening.status === 'overdue') {
        // Schedule urgent reminders more frequently
        const urgentId = await scheduleReminderIn(
          `${screening.name} OVERDUE`,
          `Your ${screening.name} screening is overdue! Please schedule your appointment immediately.`,
          1, // 1 minute from now
          'screening_reminder'
        );
        if (urgentId) identifiers.push(urgentId);

        // Schedule urgent follow-up reminders every 3 days for 2 weeks
        for (let i = 1; i <= 5; i++) {
          const urgentReminderId = await scheduleReminderIn(
            `${screening.name} URGENT`,
            `URGENT: Your ${screening.name} screening is seriously overdue. Please take action now!`,
            i * 3 * 24 * 60, // Every 3 days
            'screening_reminder'
          );
          if (urgentReminderId) identifiers.push(urgentReminderId);
        }
      } else if (screening.status === 'later' && screening.nextDue) {
        // Schedule reminders based on when it's actually due
        const dueDate = new Date(screening.nextDue);
        const timeToDue = dueDate.getTime() - now.getTime();
        const daysToDue = Math.floor(timeToDue / (1000 * 60 * 60 * 24));

        if (daysToDue > 30) {
          // Schedule reminder 1 month before
          const earlyReminder = new Date(dueDate);
          earlyReminder.setDate(dueDate.getDate() - 30);
          
          if (earlyReminder > now) {
            const earlyId = await scheduleReminderIn(
              `${screening.name} Coming Up`,
              `Your ${screening.name} screening is due in 1 month. Start planning your appointment.`,
              Math.floor((earlyReminder.getTime() - now.getTime()) / (1000 * 60)),
              'screening_reminder'
            );
            if (earlyId) identifiers.push(earlyId);
          }
        }

        if (daysToDue > 7) {
          // Schedule reminder 1 week before
          const weekReminder = new Date(dueDate);
          weekReminder.setDate(dueDate.getDate() - 7);
          
          if (weekReminder > now) {
            const weekId = await scheduleReminderIn(
              `${screening.name} Due Soon`,
              `Your ${screening.name} screening is due in 1 week. Time to schedule your appointment.`,
              Math.floor((weekReminder.getTime() - now.getTime()) / (1000 * 60)),
              'screening_reminder'
            );
            if (weekId) identifiers.push(weekId);
          }
        }

        // Schedule reminder on the due date
        if (dueDate > now) {
          const dueDateId = await scheduleReminderIn(
            `${screening.name} Due Today`,
            `Your ${screening.name} screening is due today! Don't forget to schedule your appointment.`,
            Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60)),
            'screening_reminder'
          );
          if (dueDateId) identifiers.push(dueDateId);
        }
      }

      // Store the scheduled notification IDs for this screening
      if (identifiers.length > 0) {
        await AsyncStorage.setItem(existingKey, JSON.stringify(identifiers));
      }

      return identifiers;
    } catch (error) {
      console.error('Error scheduling screening notifications:', error);
      return [];
    }
  };

  /**
   * Cancel all notifications for a specific screening (e.g., when marked as completed)
   */
  const cancelScreeningNotifications = async (screeningId: string) => {
    try {
      const existingKey = `screening_notifications_${screeningId}`;
      const existing = await AsyncStorage.getItem(existingKey);
      
      if (existing) {
        const identifiers = JSON.parse(existing);
        const { cancelNotification } = useNotifications();
        
        // Cancel all scheduled notifications for this screening
        for (const id of identifiers) {
          await cancelNotification(id);
        }
        
        // Remove from storage
        await AsyncStorage.removeItem(existingKey);
        
        console.log(`Cancelled ${identifiers.length} notifications for screening ${screeningId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error cancelling screening notifications:', error);
      return false;
    }
  };

  /**
   * Schedule periodic reminders for completed screenings that need to be repeated
   */
  const schedulePeriodicScreeningReminders = async (screening: {
    id: string;
    name: string;
    frequencyYears: number;
    lastCompleted: string;
  }) => {
    if (!hasPermission || screening.frequencyYears <= 0) {
      return [];
    }

    try {
      const lastDate = new Date(screening.lastCompleted);
      const nextDue = new Date(lastDate);
      nextDue.setFullYear(lastDate.getFullYear() + screening.frequencyYears);

      const identifiers = await schedulePeriodicScreening(
        screening.name,
        screening.frequencyYears * 12, // Convert years to months
        nextDue,
        3 // Schedule 3 occurrences
      );

      // Store the scheduled notification IDs
      const periodicKey = `periodic_notifications_${screening.id}`;
      await AsyncStorage.setItem(periodicKey, JSON.stringify(identifiers));

      return identifiers;
    } catch (error) {
      console.error('Error scheduling periodic screening reminders:', error);
      return [];
    }
  };

  /**
   * Get all scheduled notifications for a specific screening
   */
  const getScheduledNotificationsForScreening = async (screeningId: string) => {
    try {
      const immediateKey = `screening_notifications_${screeningId}`;
      const periodicKey = `periodic_notifications_${screeningId}`;
      
      const immediate = await AsyncStorage.getItem(immediateKey);
      const periodic = await AsyncStorage.getItem(periodicKey);
      
      return {
        immediate: immediate ? JSON.parse(immediate) : [],
        periodic: periodic ? JSON.parse(periodic) : [],
      };
    } catch (error) {
      console.error('Error getting scheduled notifications for screening:', error);
      return { immediate: [], periodic: [] };
    }
  };

  /**
   * Smart scheduler that automatically determines the best notification strategy
   * based on screening status, due date, and user preferences
   */
  const smartScheduleForScreening = async (screening: {
    id: string;
    name: string;
    status: 'due' | 'later' | 'overdue' | 'completed';
    nextDue?: string;
    frequencyYears?: number;
    lastCompleted?: string;
  }) => {
    // Cancel any existing notifications first
    await cancelScreeningNotifications(screening.id);

    const results = {
      immediate: [] as string[],
      periodic: [] as string[],
    };

    if (screening.status === 'completed' && screening.lastCompleted && screening.frequencyYears) {
      // Schedule periodic reminders for future occurrences
      results.periodic = await schedulePeriodicScreeningReminders({
        id: screening.id,
        name: screening.name,
        frequencyYears: screening.frequencyYears,
        lastCompleted: screening.lastCompleted,
      });
    } else {
      // Schedule immediate/upcoming reminders
      results.immediate = await scheduleScreeningNotifications(screening);
    }

    return results;
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
