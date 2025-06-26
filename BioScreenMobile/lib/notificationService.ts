import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduledDate: Date;
  type: 'screening_reminder' | 'appointment' | 'medication' | 'general';
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions with error handling
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        } catch (permissionError) {
          console.error('Error requesting notification permissions:', permissionError);
          return false;
        }
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('screening', {
          name: 'Screening Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('appointment', {
          name: 'Appointments',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async scheduleLocalNotification(notificationData: NotificationData): Promise<string | null> {
    return this.safeNotificationCall(async () => {
      await this.initialize();

      const trigger = new Date(notificationData.scheduledDate);
      const now = new Date();

      // Don't schedule if the date is in the past
      if (trigger <= now) {
        console.warn(`Cannot schedule notification - date is in the past (trigger: ${trigger.toISOString()}, now: ${now.toISOString()})`);
        return null;
      }

      // For screening reminders, allow longer scheduling periods (up to 1 year)
      // For other notifications, keep the 30-day limit
      const maxFutureTime = notificationData.type === 'screening_reminder' 
        ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);  // 30 days

      if (trigger > maxFutureTime) {
        const maxDays = notificationData.type === 'screening_reminder' ? 365 : 30;
        console.warn(`Cannot schedule notification - date is too far in the future (max ${maxDays} days)`);
        return null;
      }

      console.log(`🔔 Scheduling notification: "${notificationData.title}" for ${trigger.toLocaleString()}`);
      console.log(`⏰ Current time: ${now.toLocaleString()}`);
      console.log(`📊 Time difference: ${Math.round((trigger.getTime() - now.getTime()) / (1000 * 60))} minutes`);

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: {
            ...notificationData.data,
            notificationId: notificationData.id,
            type: notificationData.type,
          },
          sound: 'default',
        },
        trigger: {
          date: trigger,
        } as Notifications.DateTriggerInput,
      });

      console.log(`✅ Notification scheduled successfully with identifier: ${identifier}`);

      // Save notification data for management (skip for simple screening reminders to avoid clutter)
      if (notificationData.type !== 'screening_reminder') {
        await this.saveNotificationData(notificationData, identifier);
      }

      return identifier;
    }, null, `scheduleLocalNotification(${notificationData.title})`);
  }

  async scheduleRepeatingNotification(
    notificationData: NotificationData,
    repeatConfig: {
      repeats: boolean;
      seconds?: number;
      minute?: number;
      hour?: number;
      day?: number;
      month?: number;
      weekday?: number;
    }
  ): Promise<string | null> {
    try {
      await this.initialize();

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: {
            ...notificationData.data,
            notificationId: notificationData.id,
            type: notificationData.type,
          },
          sound: 'default',
        },
        trigger: {
          ...repeatConfig,
          channelId: this.getChannelId(notificationData.type),
        },
      });

      // Save notification data for management
      await this.saveNotificationData(notificationData, identifier);

      return identifier;
    } catch (error) {
      console.error('Error scheduling repeating notification:', error);
      return null;
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      await this.removeNotificationData(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem('scheduled_notifications');
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async getNotificationHistory(): Promise<NotificationData[]> {
    try {
      const stored = await AsyncStorage.getItem('scheduled_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  // Predefined notification templates
  async scheduleScreeningReminder(
    screeningType: string,
    reminderDate: Date,
    additionalData?: any
  ): Promise<string | null> {
    const notificationData: NotificationData = {
      id: `screening_${Date.now()}`,
      title: 'Screening Reminder',
      body: `Time for your ${screeningType} screening!`,
      scheduledDate: reminderDate,
      type: 'screening_reminder',
      data: {
        screeningType,
        ...additionalData,
      },
    };

    return this.scheduleLocalNotification(notificationData);
  }

  async scheduleAppointmentReminder(
    appointmentDetails: string,
    reminderDate: Date,
    additionalData?: any
  ): Promise<string | null> {
    const notificationData: NotificationData = {
      id: `appointment_${Date.now()}`,
      title: 'Appointment Reminder',
      body: `Don't forget: ${appointmentDetails}`,
      scheduledDate: reminderDate,
      type: 'appointment',
      data: {
        appointmentDetails,
        ...additionalData,
      },
    };

    return this.scheduleLocalNotification(notificationData);
  }

  async scheduleMedicationReminder(
    medicationName: string,
    dosage: string,
    reminderTimes: Date[],
    additionalData?: any
  ): Promise<string[]> {
    const identifiers: string[] = [];

    for (const reminderTime of reminderTimes) {
      const notificationData: NotificationData = {
        id: `medication_${Date.now()}_${Math.random()}`,
        title: 'Medication Reminder',
        body: `Time to take ${medicationName} - ${dosage}`,
        scheduledDate: reminderTime,
        type: 'medication',
        data: {
          medicationName,
          dosage,
          ...additionalData,
        },
      };

      const identifier = await this.scheduleLocalNotification(notificationData);
      if (identifier) {
        identifiers.push(identifier);
      }
    }

    return identifiers;
  }

  // Safe wrapper for notification operations to prevent crashes
  private async safeNotificationCall<T>(
    operation: () => Promise<T>,
    fallback: T,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`Safe notification call failed for ${operationName}:`, error);
      // Log additional context for debugging
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return fallback;
    }
  }

  // Utility methods
  private async saveNotificationData(notificationData: NotificationData, identifier: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('scheduled_notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      
      notifications.push({
        ...notificationData,
        identifier,
        createdAt: new Date().toISOString(),
      });

      await AsyncStorage.setItem('scheduled_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notification data:', error);
    }
  }

  private async removeNotificationData(identifier: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('scheduled_notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      
      const filtered = notifications.filter((n: any) => n.identifier !== identifier);
      await AsyncStorage.setItem('scheduled_notifications', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing notification data:', error);
    }
  }

  private getChannelId(type: NotificationData['type']): string {
    switch (type) {
      case 'screening_reminder':
        return 'screening';
      case 'appointment':
        return 'appointment';
      case 'medication':
        return 'default';
      case 'general':
        return 'default';
      default:
        return 'default';
    }
  }
}

export default NotificationService;
