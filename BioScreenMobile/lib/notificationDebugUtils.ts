import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debug utilities for notification troubleshooting
 */
export class NotificationDebugUtils {
  
  /**
   * Clear all notifications and reset storage
   */
  static async clearAllNotifications(): Promise<void> {
    try {
      // Cancel all scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Clear all notification-related AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const notificationKeys = keys.filter(key => 
        key.includes('notification') || 
        key.includes('screening_notifications') ||
        key.includes('periodic_notifications')
      );
      
      if (notificationKeys.length > 0) {
        await AsyncStorage.multiRemove(notificationKeys);
      }
      
      console.log(`Cleared all notifications and ${notificationKeys.length} storage keys`);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Get current notification status
   */
  static async getNotificationStatus(): Promise<{
    scheduled: number;
    storageKeys: string[];
    permissions: any;
  }> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const keys = await AsyncStorage.getAllKeys();
      const notificationKeys = keys.filter(key => 
        key.includes('notification') || 
        key.includes('screening_notifications') ||
        key.includes('periodic_notifications')
      );
      const permissions = await Notifications.getPermissionsAsync();
      
      return {
        scheduled: scheduled.length,
        storageKeys: notificationKeys,
        permissions
      };
    } catch (error) {
      console.error('Error getting notification status:', error);
      return { scheduled: 0, storageKeys: [], permissions: null };
    }
  }

  /**
   * Log all scheduled notifications with details
   */
  static async logScheduledNotifications(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`\n=== SCHEDULED NOTIFICATIONS (${scheduled.length}) ===`);
      
      scheduled.forEach((notification, index) => {
        const trigger = notification.trigger as any;
        const date = trigger?.date ? new Date(trigger.date) : 'Unknown';
        
        console.log(`${index + 1}. ${notification.content.title}`);
        console.log(`   ID: ${notification.identifier}`);
        console.log(`   Body: ${notification.content.body}`);
        console.log(`   Scheduled for: ${date}`);
        console.log(`   Data:`, notification.content.data);
        console.log('---');
      });
    } catch (error) {
      console.error('Error logging notifications:', error);
    }
  }

  /**
   * Check for and remove duplicate notifications
   */
  static async removeDuplicateNotifications(): Promise<number> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const seen = new Set();
      const duplicates: string[] = [];
      
      scheduled.forEach(notification => {
        const key = `${notification.content.title}-${notification.content.body}`;
        if (seen.has(key)) {
          duplicates.push(notification.identifier);
        } else {
          seen.add(key);
        }
      });
      
      // Cancel duplicates
      for (const id of duplicates) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      
      console.log(`Removed ${duplicates.length} duplicate notifications`);
      return duplicates.length;
    } catch (error) {
      console.error('Error removing duplicates:', error);
      return 0;
    }
  }
}

export default NotificationDebugUtils;
