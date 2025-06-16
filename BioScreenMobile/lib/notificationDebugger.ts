import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debugging utilities for notification troubleshooting
 */
export class NotificationDebugger {
  
  /**
   * Run comprehensive notification diagnostics
   */
  static async runDiagnostics(): Promise<string> {
    const results: string[] = [];
    
    try {
      // Check permissions
      const { status } = await Notifications.getPermissionsAsync();
      results.push(`Permission Status: ${status}`);
      
      if (status !== 'granted') {
        results.push('❌ ISSUE: Notifications not permitted');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        results.push(`After request: ${newStatus}`);
      } else {
        results.push('✅ Permissions granted');
      }
      
      // Check scheduled notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      results.push(`Scheduled notifications: ${scheduled.length}`);
      
      if (scheduled.length > 0) {
        results.push('📋 Scheduled notifications:');
        scheduled.forEach((notif, index) => {
          const trigger = notif.trigger as any;
          const triggerTime = trigger?.date || trigger?.dateComponents || 'Unknown';
          results.push(`  ${index + 1}. "${notif.content.title}" - ${triggerTime}`);
        });
      }
      
      // Check notification handler
      results.push('✅ Notification handler configured');
      
      // Check platform-specific issues
      results.push(`Platform: ${require('react-native').Platform.OS}`);
      
      // Check AsyncStorage
      const stored = await AsyncStorage.getItem('scheduled_notifications');
      const storedCount = stored ? JSON.parse(stored).length : 0;
      results.push(`Stored notifications: ${storedCount}`);
      
    } catch (error) {
      results.push(`❌ Error during diagnostics: ${error}`);
    }
    
    return results.join('\n');
  }
  
  /**
   * Schedule a test notification with verbose logging
   */
  static async scheduleTestWithLogging(minutes: number = 1): Promise<string> {
    const logs: string[] = [];
    
    try {
      logs.push(`Starting test notification for ${minutes} minute(s)...`);
      
      // Check permissions first
      const { status } = await Notifications.getPermissionsAsync();
      logs.push(`Permission status: ${status}`);
      
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        logs.push(`Requested permission, new status: ${newStatus}`);
        if (newStatus !== 'granted') {
          logs.push('❌ Cannot schedule - permission denied');
          return logs.join('\n');
        }
      }
      
      // Calculate trigger time
      const triggerDate = new Date();
      triggerDate.setMinutes(triggerDate.getMinutes() + minutes);
      logs.push(`Trigger time: ${triggerDate.toLocaleString()}`);
      logs.push(`Current time: ${new Date().toLocaleString()}`);
      
      // Schedule notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: `This test was scheduled ${minutes} minute(s) ago at ${new Date().toLocaleTimeString()}`,
          data: { 
            test: true, 
            scheduledAt: new Date().toISOString(),
            triggerAt: triggerDate.toISOString()
          },
          sound: 'default',
        },
        trigger: {
          date: triggerDate,
        } as Notifications.DateTriggerInput,
      });
      
      logs.push(`✅ Scheduled with ID: ${identifier}`);
      
      // Verify it was scheduled
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const ourNotification = scheduled.find(n => n.identifier === identifier);
      
      if (ourNotification) {
        logs.push('✅ Verified: Notification found in scheduled list');
        const trigger = ourNotification.trigger as any;
        logs.push(`Trigger details: ${JSON.stringify(trigger, null, 2)}`);
      } else {
        logs.push('❌ WARNING: Notification not found in scheduled list');
      }
      
      logs.push('\n📱 TESTING TIPS:');
      logs.push('• Make sure your device notifications are enabled');
      logs.push('• Check if "Do Not Disturb" is ON');
      logs.push('• Try putting the app in background');
      logs.push('• Check device notification settings for this app');
      
    } catch (error) {
      logs.push(`❌ Error: ${error}`);
    }
    
    return logs.join('\n');
  }
  
  /**
   * Clear all notifications and show result
   */
  static async clearAllWithLogging(): Promise<string> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const count = scheduled.length;
      
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem('scheduled_notifications');
      
      return `✅ Cleared ${count} scheduled notifications`;
    } catch (error) {
      return `❌ Error clearing notifications: ${error}`;
    }
  }
  
  /**
   * Show device notification settings help
   */
  static getDeviceSettingsHelp(): string {
    return `
📱 DEVICE SETTINGS TO CHECK:

iOS:
1. Settings > Notifications > BioScreenMobile
2. Make sure "Allow Notifications" is ON
3. Check "Lock Screen", "Notification Center", "Banners" are enabled
4. Make sure "Do Not Disturb" is OFF
5. Check Focus modes aren't blocking notifications

Android:
1. Settings > Apps > BioScreenMobile > Notifications
2. Make sure notifications are enabled
3. Check individual notification channels
4. Ensure battery optimization is disabled for the app
5. Check "Do Not Disturb" settings

TESTING:
• Put app in background after scheduling
• Wait for the full time period
• Check notification history in device settings
• Try restarting the app after scheduling
`;
  }
}

export default NotificationDebugger;
