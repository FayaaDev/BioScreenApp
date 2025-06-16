import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import NotificationService, { NotificationData } from '../lib/notificationService';

interface NotificationContextType {
  isInitialized: boolean;
  hasPermission: boolean;
  scheduleNotification: (data: NotificationData) => Promise<string | null>;
  cancelNotification: (id: string) => Promise<void>;
  scheduleScreeningReminder: (screeningType: string, date: Date, data?: any) => Promise<string | null>;
  scheduleAppointmentReminder: (details: string, date: Date, data?: any) => Promise<string | null>;
  scheduleMedicationReminder: (name: string, dosage: string, times: Date[], data?: any) => Promise<string[]>;
  getScheduledNotifications: () => Promise<Notifications.NotificationRequest[]>;
  cancelAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    initializeNotifications();
    setupNotificationListeners();

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      const success = await notificationService.initialize();
      setIsInitialized(true);
      setHasPermission(success);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      setIsInitialized(true);
      setHasPermission(false);
    }
  };

  const setupNotificationListeners = () => {
    // Listen for notification interactions when app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      // In development/Expo Go, show an alert to simulate the notification
      if (__DEV__) {
        Alert.alert(
          notification.request.content.title || 'Notification',
          notification.request.content.body || 'You have a new notification',
          [{ text: 'OK' }]
        );
      }
    });

    // Listen for notification interactions when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle user interaction with notification
      const data = response.notification.request.content.data;
      
      // You can navigate to specific screens based on notification type
      if (data?.type === 'screening_reminder') {
        // Navigate to screening screen
        console.log('Navigate to screening screen');
      } else if (data?.type === 'appointment') {
        // Navigate to appointment screen
        console.log('Navigate to appointment screen');
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  };

  const scheduleNotification = async (data: NotificationData): Promise<string | null> => {
    if (!hasPermission) {
      console.warn('No notification permission');
      return null;
    }
    return notificationService.scheduleLocalNotification(data);
  };

  const cancelNotification = async (id: string): Promise<void> => {
    return notificationService.cancelNotification(id);
  };

  const scheduleScreeningReminder = async (
    screeningType: string,
    date: Date,
    data?: any
  ): Promise<string | null> => {
    if (!hasPermission) {
      console.warn('No notification permission');
      return null;
    }
    return notificationService.scheduleScreeningReminder(screeningType, date, data);
  };

  const scheduleAppointmentReminder = async (
    details: string,
    date: Date,
    data?: any
  ): Promise<string | null> => {
    if (!hasPermission) {
      console.warn('No notification permission');
      return null;
    }
    return notificationService.scheduleAppointmentReminder(details, date, data);
  };

  const scheduleMedicationReminder = async (
    name: string,
    dosage: string,
    times: Date[],
    data?: any
  ): Promise<string[]> => {
    if (!hasPermission) {
      console.warn('No notification permission');
      return [];
    }
    return notificationService.scheduleMedicationReminder(name, dosage, times, data);
  };

  const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
    return notificationService.getScheduledNotifications();
  };

  const cancelAllNotifications = async (): Promise<void> => {
    return notificationService.cancelAllNotifications();
  };

  const value: NotificationContextType = {
    isInitialized,
    hasPermission,
    scheduleNotification,
    cancelNotification,
    scheduleScreeningReminder,
    scheduleAppointmentReminder,
    scheduleMedicationReminder,
    getScheduledNotifications,
    cancelAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
