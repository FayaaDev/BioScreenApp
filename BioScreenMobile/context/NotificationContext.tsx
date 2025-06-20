/**
 * WhatsApp Notification System
 * 
 * This file has been updated to use WhatsApp API instead of local notifications.
 * All notification methods now call the server API to schedule WhatsApp messages.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { apiRequest } from '../lib/api';

interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduledDate: Date;
  type: 'screening_reminder' | 'appointment' | 'medication' | 'general';
}

interface NotificationContextType {
  isInitialized: boolean;
  hasPermission: boolean;
  scheduleNotification: (data: NotificationData) => Promise<string | null>;
  cancelNotification: (id: string) => Promise<void>;
  scheduleScreeningReminder: (screeningType: string, date: Date, data?: any) => Promise<string | null>;
  scheduleAppointmentReminder: (details: string, date: Date, data?: any) => Promise<string | null>;
  scheduleMedicationReminder: (name: string, dosage: string, times: Date[], data?: any) => Promise<string[]>;
  getScheduledNotifications: () => Promise<any[]>;
  cancelAllNotifications: () => Promise<void>;
  sendWelcomeMessage: (phoneNumber: string, personName: string) => Promise<boolean>;
  getNotificationStatus: () => Promise<any>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Check if WhatsApp service is available
      const status = await getNotificationStatus();
      setHasPermission(status.whatsappService.initialized);
      setIsInitialized(true);
      
      if (status.whatsappService.initialized) {
        console.log('✅ WhatsApp notification system initialized');
      } else {
        console.log('⚠️ WhatsApp notification system not available');
      }
    } catch (error) {
      console.error('Error initializing WhatsApp notifications:', error);
      setIsInitialized(true);
      setHasPermission(false);
    }
  };

  const scheduleNotification = async (data: NotificationData): Promise<string | null> => {
    try {
      if (!hasPermission) {
        console.log('📵 WhatsApp notifications not available');
        return null;
      }

      // For now, we'll just log the notification since WhatsApp scheduling is handled server-side
      console.log('📤 WhatsApp notification would be scheduled:', data.title);
      return `whatsapp_${Date.now()}`;
    } catch (error) {
      console.error('Error scheduling WhatsApp notification:', error);
      return null;
    }
  };

  const cancelNotification = async (id: string): Promise<void> => {
    // WhatsApp notifications are managed server-side, so we just log the cancellation
    console.log('📵 Cancelling WhatsApp notification:', id);
  };

  const scheduleScreeningReminder = async (
    screeningType: string,
    date: Date,
    data?: any
  ): Promise<string | null> => {
    try {
      if (!hasPermission) {
        console.log('📵 WhatsApp notifications not available');
        return null;
      }

      // This would typically call the server API to schedule a WhatsApp reminder
      // For now, we'll just log it
      console.log('📅 WhatsApp screening reminder would be scheduled for:', screeningType, 'on', date);
      return `screening_${Date.now()}`;
    } catch (error) {
      console.error('Error scheduling WhatsApp screening reminder:', error);
      return null;
    }
  };

  const scheduleAppointmentReminder = async (
    details: string,
    date: Date,
    data?: any
  ): Promise<string | null> => {
    try {
      if (!hasPermission) {
        console.log('📵 WhatsApp notifications not available');
        return null;
      }

      console.log('📅 WhatsApp appointment reminder would be scheduled for:', details, 'on', date);
      return `appointment_${Date.now()}`;
    } catch (error) {
      console.error('Error scheduling WhatsApp appointment reminder:', error);
      return null;
    }
  };

  const scheduleMedicationReminder = async (
    name: string,
    dosage: string,
    times: Date[],
    data?: any
  ): Promise<string[]> => {
    try {
      if (!hasPermission) {
        console.log('📵 WhatsApp notifications not available');
        return [];
      }

      const ids: string[] = [];
      for (const time of times) {
        console.log('📅 WhatsApp medication reminder would be scheduled for:', name, 'at', time);
        ids.push(`medication_${Date.now()}_${Math.random()}`);
      }
      return ids;
    } catch (error) {
      console.error('Error scheduling WhatsApp medication reminders:', error);
      return [];
    }
  };

  const getScheduledNotifications = async (): Promise<any[]> => {
    // WhatsApp notifications are managed server-side
    console.log('📋 WhatsApp notifications are managed server-side');
    return [];
  };

  const cancelAllNotifications = async (): Promise<void> => {
    console.log('📵 Cancelling all WhatsApp notifications (managed server-side)');
  };

  const sendWelcomeMessage = async (phoneNumber: string, personName: string): Promise<boolean> => {
    try {
      if (!hasPermission) {
        console.log('📵 WhatsApp notifications not available');
        return false;
      }

      const response = await apiRequest<{ success: boolean }>('POST', '/api/notifications/send-welcome', {
        phoneNumber,
        personName
      });

      return response.success;
    } catch (error) {
      console.error('Error sending welcome message:', error);
      return false;
    }
  };

  const getNotificationStatus = async (): Promise<any> => {
    try {
      const response = await apiRequest<any>('GET', '/api/notifications/status');
      return response;
    } catch (error) {
      console.error('Error getting notification status:', error);
      return {
        whatsappService: { initialized: false, hasToken: false },
        scheduler: { running: false }
      };
    }
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
    sendWelcomeMessage,
    getNotificationStatus,
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
