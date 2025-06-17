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
      const storageKey = `screening_notifications_${screening.id}`;
      const existing = await AsyncStorage.getItem(storageKey);
      
      if (existing) {
        console.log(`⏭️ Notifications already scheduled for screening ${screening.id}`);
        return JSON.parse(existing);
      }

      const now = new Date();

      if (screening.status === 'due') {
        console.log(`📅 Scheduling simple reminders for DUE screening: ${screening.name}`);
        
        // Schedule one immediate reminder and one follow-up
        const immediateId = await scheduleReminderIn(
          `${screening.name} Due`,
          `Your ${screening.name} screening is due. Please schedule your appointment.`,
          2, // 2 minutes from now
          'screening_reminder'
        );
        if (immediateId) {
          identifiers.push(immediateId);
          console.log(`✅ Scheduled immediate reminder for ${screening.name}`);
        }

        // Schedule one follow-up in 24 hours
        const followUpId = await scheduleReminderIn(
          `${screening.name} Reminder`,
          `Reminder: Your ${screening.name} screening is still due.`,
          24 * 60, // 24 hours
          'screening_reminder'
        );
        if (followUpId) {
          identifiers.push(followUpId);
          console.log(`✅ Scheduled follow-up reminder for ${screening.name}`);
        }
      } else if (screening.status === 'overdue') {
        console.log(`🚨 Scheduling simple reminders for OVERDUE screening: ${screening.name}`);
        
        // Schedule one immediate urgent reminder
        const urgentId = await scheduleReminderIn(
          `${screening.name} Overdue`,
          `Your ${screening.name} screening is overdue! Please schedule your appointment.`,
          1, // 1 minute from now
          'screening_reminder'
        );
        if (urgentId) {
          identifiers.push(urgentId);
          console.log(`✅ Scheduled overdue reminder for ${screening.name}`);
        }

        // Schedule one follow-up in 3 days
        const followUpId = await scheduleReminderIn(
          `${screening.name} Still Overdue`,
          `Reminder: Your ${screening.name} screening is still overdue.`,
          3 * 24 * 60, // 3 days
          'screening_reminder'
        );
        if (followUpId) {
          identifiers.push(followUpId);
          console.log(`✅ Scheduled follow-up for ${screening.name}`);
        }
      } else if (screening.status === 'later' && screening.nextDue) {
        console.log(`📅 Scheduling simple reminder for LATER screening: ${screening.name}`);
        
        // For "later" screenings (like completed repeatable tests), schedule only ONE simple reminder
        const dueDate = new Date(screening.nextDue);
        const timeToDue = dueDate.getTime() - now.getTime();
        const daysToDue = Math.floor(timeToDue / (1000 * 60 * 60 * 24));

        // Only schedule one reminder based on how far away the next screening is
        let reminderDate: Date | null = null;
        let reminderTitle: string = '';
        let reminderMessage: string = '';

        if (daysToDue > 180) {
          // If more than 6 months away, don't schedule any notification yet
          console.log(`⏳ ${screening.name} is ${daysToDue} days away - no notification needed yet`);
        } else if (daysToDue > 60) {
          // If 2-6 months away, remind 1 month before
          reminderDate = new Date(dueDate);
          reminderDate.setDate(dueDate.getDate() - 30);
          reminderTitle = `${screening.name} Coming Up`;
          reminderMessage = `Your next ${screening.name} screening is due in 1 month.`;
        } else if (daysToDue > 7) {
          // If 1 week to 2 months away, remind 1 week before
          reminderDate = new Date(dueDate);
          reminderDate.setDate(dueDate.getDate() - 7);
          reminderTitle = `${screening.name} Due Soon`;
          reminderMessage = `Your ${screening.name} screening is due in 1 week.`;
        } else if (daysToDue > 0) {
          // If less than 7 days, remind on due date
          reminderDate = dueDate;
          reminderTitle = `${screening.name} Due Today`;
          reminderMessage = `Your ${screening.name} screening is due today.`;
        }

        // Schedule the single reminder
        if (reminderDate && reminderDate > now) {
          const reminderId = await scheduleReminderIn(
            reminderTitle,
            reminderMessage,
            Math.floor((reminderDate.getTime() - now.getTime()) / (1000 * 60)),
            'screening_reminder'
          );
          if (reminderId) {
            identifiers.push(reminderId);
            console.log(`✅ Scheduled single reminder for ${screening.name} - ${reminderTitle}`);
          }
        }
      }

      // Store the scheduled notification IDs for this screening (simplified)
      if (identifiers.length > 0) {
        await AsyncStorage.setItem(storageKey, JSON.stringify(identifiers));
        console.log(`💾 Stored ${identifiers.length} notification IDs for ${screening.name}`);
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
