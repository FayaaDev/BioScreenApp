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
    // Validate parameters
    const validation = validateNotificationParams(title, minutes);
    if (!validation.isValid) {
      console.warn(`❌ Cannot schedule notification "${title}": ${validation.reason}`);
      return null;
    }
    
    console.log(`✅ Validation passed for "${title}": ${validation.reason}`);
    
    const notificationDate = new Date();
    notificationDate.setMinutes(notificationDate.getMinutes() + minutes);

    const notificationData: NotificationData = {
      id: `reminder_${Date.now()}`,
      title,
      body: message,
      scheduledDate: notificationDate,
      type,
      data: { reminderMinutes: minutes },
    };

    return scheduleNotification(notificationData);
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
    const start = startDate || new Date();
    const reminderTimes: Date[] = [];

    // Schedule for next 30 days
    for (let i = 0; i < 30; i++) {
      const reminderDate = new Date(start);
      reminderDate.setDate(start.getDate() + i);
      reminderDate.setHours(timeOfDay.hour, timeOfDay.minute, 0, 0);
      
      // Only schedule future dates
      if (reminderDate > new Date()) {
        reminderTimes.push(reminderDate);
      }
    }

    return scheduleMedicationReminder(medicationName, dosage, reminderTimes);
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
    const identifiers: string[] = [];

    for (let i = 0; i < howManyReminders; i++) {
      const reminderDate = new Date(nextDueDate);
      reminderDate.setMonth(reminderDate.getMonth() + (intervalMonths * i));

      if (reminderDate > new Date()) {
        const identifier = await scheduleScreeningReminder(
          screeningType,
          reminderDate,
          {
            intervalMonths,
            reminderNumber: i + 1,
            totalReminders: howManyReminders,
          }
        );
        
        if (identifier) {
          identifiers.push(identifier);
        }
      }
    }

    return identifiers;
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
    const identifiers: string[] = [];

    for (const reminder of reminders) {
      const reminderDate = new Date(appointmentDate);
      reminderDate.setMinutes(reminderDate.getMinutes() - reminder.beforeMinutes);

      if (reminderDate > new Date()) {
        const identifier = await scheduleAppointmentReminder(
          `${reminder.message}${appointmentDetails}`,
          reminderDate,
          {
            originalAppointmentDate: appointmentDate.toISOString(),
            minutesBefore: reminder.beforeMinutes,
          }
        );

        if (identifier) {
          identifiers.push(identifier);
        }
      }
    }

    return identifiers;
  };

  /**
   * Schedule health check reminder based on age and risk factors
   */
  const scheduleHealthCheckReminder = async (
    age: number,
    riskFactors: string[] = [],
    lastCheckDate?: Date
  ) => {
    const identifiers: string[] = [];
    
    // Determine screening schedule based on age
    const screenings = getRecommendedScreenings(age, riskFactors);
    
    for (const screening of screenings) {
      const nextDue = calculateNextDueDate(screening, lastCheckDate);
      
      if (nextDue > new Date()) {
        const identifier = await scheduleScreeningReminder(
          screening.name,
          nextDue,
          {
            ageBasedRecommendation: true,
            riskFactors,
            intervalMonths: screening.intervalMonths,
          }
        );
        
        if (identifier) {
          identifiers.push(identifier);
        }
      }
    }

    return identifiers;
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
