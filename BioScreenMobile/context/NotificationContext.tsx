/**
 * NOTIFICATIONS COMPLETELY DISABLED
 * 
 * This file has been modified to disable all notification functionality.
 * All notification methods return early without performing any actions.
 * No permissions are requested and no notifications are scheduled.
 */

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
    // NOTIFICATIONS DISABLED - Skip initialization
    console.log('📵 Notifications disabled - skipping initialization');
    setIsInitialized(true);
    setHasPermission(false); // Always false when disabled
  };

  const setupNotificationListeners = () => {
    // NOTIFICATIONS DISABLED - Skip setting up listeners
    console.log('📵 Notifications disabled - skipping notification listeners setup');
    return () => {
      // No cleanup needed since no listeners were set up
    };
  };

  const scheduleNotification = async (data: NotificationData): Promise<string | null> => {
    // NOTIFICATIONS DISABLED - Return early
    console.log('📵 Notifications disabled - skipping schedule notification for:', data.title);
    return null;
  };

  const cancelNotification = async (id: string): Promise<void> => {
    // NOTIFICATIONS DISABLED - Return early
    console.log('📵 Notifications disabled - skipping cancel notification for:', id);
    return;
  };

  const scheduleScreeningReminder = async (
    screeningType: string,
    date: Date,
    data?: any
  ): Promise<string | null> => {
    // NOTIFICATIONS DISABLED - Return early
    console.log('📵 Notifications disabled - skipping screening reminder for:', screeningType);
    return null;
  };

  const scheduleAppointmentReminder = async (
    details: string,
    date: Date,
    data?: any
  ): Promise<string | null> => {
    // NOTIFICATIONS DISABLED - Return early
    console.log('📵 Notifications disabled - skipping appointment reminder for:', details);
    return null;
  };

  const scheduleMedicationReminder = async (
    name: string,
    dosage: string,
    times: Date[],
    data?: any
  ): Promise<string[]> => {
    // NOTIFICATIONS DISABLED - Return early
    console.log('📵 Notifications disabled - skipping medication reminder for:', name);
    return [];
  };

  const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
    // NOTIFICATIONS DISABLED - Return empty array
    console.log('📵 Notifications disabled - returning empty scheduled notifications list');
    return [];
  };

  const cancelAllNotifications = async (): Promise<void> => {
    // NOTIFICATIONS DISABLED - Return early
    console.log('📵 Notifications disabled - skipping cancel all notifications');
    return;
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
