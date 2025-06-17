import { differenceInDays, parseISO } from 'date-fns';

/**
 * Utility functions for notification logic
 */

export interface ScreeningData {
  id: string;
  name: string;
  status: 'due' | 'later' | 'overdue' | 'completed';
  nextDue?: string;
  frequencyYears?: number;
}

/**
 * Determines if a screening should have notifications scheduled
 */
export function shouldScheduleNotifications(screening: ScreeningData): boolean {
  // Always schedule for due and overdue screenings
  if (screening.status === 'due' || screening.status === 'overdue') {
    return true;
  }
  
  // Never schedule for completed screenings
  if (screening.status === 'completed') {
    return false;
  }
  
  // For 'later' screenings, only schedule if due within 6 months
  if (screening.status === 'later' && screening.nextDue) {
    try {
      const nextDueDate = parseISO(screening.nextDue);
      const now = new Date();
      const daysUntilDue = differenceInDays(nextDueDate, now);
      
      // Only schedule if due within 6 months (180 days)
      return daysUntilDue >= 0 && daysUntilDue <= 180;
    } catch (error) {
      console.error('Error parsing nextDue date:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Gets a human-readable reason why notifications are or aren't being scheduled
 */
export function getNotificationReason(screening: ScreeningData): string {
  if (screening.status === 'due') {
    return `✅ Screening is DUE - notifications will be scheduled immediately`;
  }
  
  if (screening.status === 'overdue') {
    return `🚨 Screening is OVERDUE - urgent notifications will be scheduled`;
  }
  
  if (screening.status === 'completed') {
    return `✅ Screening is COMPLETED - no notifications needed`;
  }
  
  if (screening.status === 'later' && screening.nextDue) {
    try {
      const nextDueDate = parseISO(screening.nextDue);
      const now = new Date();
      const daysUntilDue = differenceInDays(nextDueDate, now);
      
      if (daysUntilDue < 0) {
        return `❌ Next due date is in the past (${Math.abs(daysUntilDue)} days ago)`;
      } else if (daysUntilDue > 180) {
        return `⏳ Due in ${daysUntilDue} days (${Math.round(daysUntilDue/30)} months) - no notification needed yet`;
      } else if (daysUntilDue > 60) {
        return `✅ Due in ${daysUntilDue} days - one reminder will be scheduled 1 month before`;
      } else if (daysUntilDue > 7) {
        return `✅ Due in ${daysUntilDue} days - one reminder will be scheduled 1 week before`;
      } else {
        return `✅ Due in ${daysUntilDue} days - one reminder will be scheduled on due date`;
      }
    } catch (error) {
      return `❌ Invalid next due date: ${screening.nextDue}`;
    }
  }
  
  return `❌ Status '${screening.status}' - no notifications`;
}

/**
 * Validates notification scheduling parameters
 */
export function validateNotificationParams(title: string, minutes: number): {
  isValid: boolean;
  reason: string;
} {
  if (!title || title.trim().length === 0) {
    return { isValid: false, reason: 'Title is empty' };
  }
  
  if (minutes <= 0) {
    return { isValid: false, reason: `Invalid minutes: ${minutes}` };
  }
  
  const scheduledDate = new Date();
  scheduledDate.setMinutes(scheduledDate.getMinutes() + minutes);
  
  const now = new Date();
  const maxFutureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
  
  if (scheduledDate <= now) {
    return { isValid: false, reason: 'Scheduled date is in the past' };
  }
  
  if (scheduledDate > maxFutureDate) {
    return { isValid: false, reason: 'Scheduled date is too far in the future' };
  }
  
  return { 
    isValid: true, 
    reason: `Valid - scheduled for ${scheduledDate.toLocaleString()}` 
  };
}
