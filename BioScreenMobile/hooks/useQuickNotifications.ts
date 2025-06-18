/**
 * NOTIFICATIONS COMPLETELY DISABLED
 * 
 * This file has been modified to disable all notification functionality.
 * All quick notification methods return early without scheduling any notifications.
 */

import { useNotifications } from '../context/NotificationContext';
import { NotificationData } from '../lib/notificationService';
import { validateNotificationParams } from '../lib/notificationUtils';

/**
 * Custom hook for easy notification scheduling with common use cases
 */
export const useQuickNotifications = () => {
  const {
    scheduleScreeningReminder,
    scheduleAppointmentReminder,
    scheduleMedicationReminder,
    scheduleNotification,
  } = useNotifications();

  /**
   * Schedule a reminder notification for a specific number of minutes from now
   */
  const scheduleReminderIn = async (
    title: string,
    message: string,
    minutes: number,
    type: 'screening_reminder' | 'appointment' | 'medication' | 'general' = 'general'
  ) => {
    // NOTIFICATIONS DISABLED - Return early
    console.log('📵 Notifications disabled - skipping reminder for:', title);
    return null;
  };

  /**
   * Schedule daily medication reminders
   */
  const scheduleDailyMedication = async (
    medicationName: string,
    dosage: string,
    timeOfDay: { hour: number; minute: number },
    startDate?: Date
  ) => {
    // NOTIFICATIONS DISABLED - Return empty array
    console.log('📵 Notifications disabled - skipping daily medication for:', medicationName);
    return [];
  };

  /**
   * Schedule screening reminders based on screening type and intervals
   */
  const schedulePeriodicScreening = async (
    screeningType: string,
    intervalMonths: number,
    nextDueDate: Date,
    howManyReminders: number = 3
  ) => {
    // NOTIFICATIONS DISABLED - Return empty array
    console.log('📵 Notifications disabled - skipping periodic screening for:', screeningType);
    return [];
  };

  /**
   * Schedule appointment reminder with multiple alerts (day before, hour before)
   */
  const scheduleAppointmentWithMultipleReminders = async (
    appointmentDetails: string,
    appointmentDate: Date,
    reminders: { beforeMinutes: number; message: string }[] = [
      { beforeMinutes: 1440, message: 'Tomorrow you have: ' }, // Day before
      { beforeMinutes: 60, message: 'In 1 hour you have: ' },   // Hour before
      { beforeMinutes: 15, message: 'In 15 minutes you have: ' }, // 15 minutes before
    ]
  ) => {
    // NOTIFICATIONS DISABLED - Return empty array
    console.log('📵 Notifications disabled - skipping appointment reminders for:', appointmentDetails);
    return [];
  };

  /**
   * Schedule health check reminder based on age and risk factors
   */
  const scheduleHealthCheckReminder = async (
    age: number,
    riskFactors: string[] = [],
    lastCheckDate?: Date
  ) => {
    // NOTIFICATIONS DISABLED - Return empty array
    console.log('📵 Notifications disabled - skipping health check reminder for age:', age);
    return [];
  };

  return {
    scheduleReminderIn,
    scheduleDailyMedication,
    schedulePeriodicScreening,
    scheduleAppointmentWithMultipleReminders,
    scheduleHealthCheckReminder,
  };
};

// Helper functions
const getRecommendedScreenings = (age: number, riskFactors: string[]) => {
  const screenings = [];

  // Basic screenings for all adults
  if (age >= 18) {
    screenings.push({
      name: 'Blood Pressure Check',
      intervalMonths: 12,
    });
  }

  if (age >= 20) {
    screenings.push({
      name: 'Cholesterol Screening',
      intervalMonths: 60, // Every 5 years
    });
  }

  if (age >= 25) {
    screenings.push({
      name: 'Diabetes Screening',
      intervalMonths: 36, // Every 3 years
    });
  }

  // Cancer screenings
  if (age >= 21) {
    screenings.push({
      name: 'Cervical Cancer Screening',
      intervalMonths: 36, // Every 3 years
    });
  }

  if (age >= 40) {
    screenings.push({
      name: 'Mammogram',
      intervalMonths: 12, // Annually
    });
  }

  if (age >= 45 || riskFactors.includes('family_history_colorectal')) {
    screenings.push({
      name: 'Colorectal Cancer Screening',
      intervalMonths: 12, // Annually for certain tests
    });
  }

  if (age >= 55 && (riskFactors.includes('smoking') || riskFactors.includes('former_smoker'))) {
    screenings.push({
      name: 'Lung Cancer Screening',
      intervalMonths: 12, // Annually
    });
  }

  return screenings;
};

const calculateNextDueDate = (screening: { intervalMonths: number }, lastCheckDate?: Date) => {
  const baseDate = lastCheckDate || new Date();
  const nextDue = new Date(baseDate);
  nextDue.setMonth(nextDue.getMonth() + screening.intervalMonths);
  return nextDue;
};

export default useQuickNotifications;
