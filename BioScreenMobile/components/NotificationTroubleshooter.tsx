import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NotificationTroubleshooter: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [lastTestResult, setLastTestResult] = useState<string>('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledCount(scheduled.length);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      Alert.alert('Permission Status', `New status: ${status}`);
    } catch (error) {
      Alert.alert('Error', `Failed to request permissions: ${error}`);
    }
  };

  const scheduleImmediateTest = async () => {
    try {
      // Schedule for 10 seconds from now
      const triggerDate = new Date();
      triggerDate.setSeconds(triggerDate.getSeconds() + 10);

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Immediate Test',
          body: `Scheduled at ${new Date().toLocaleTimeString()} for 10 seconds later`,
          sound: 'default',
        },
        trigger: {
          date: triggerDate,
        } as Notifications.DateTriggerInput,
      });

      setLastTestResult(`Scheduled for 10 seconds (ID: ${identifier})`);
      Alert.alert('Test Scheduled', 'Notification will appear in 10 seconds. Keep the app in background to test.');
      
      // Refresh count
      checkStatus();
    } catch (error) {
      setLastTestResult(`Error: ${error}`);
      Alert.alert('Error', `Failed to schedule: ${error}`);
    }
  };

  const clearAll = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      checkStatus();
      Alert.alert('Success', 'All notifications cleared');
    } catch (error) {
      Alert.alert('Error', `Failed to clear: ${error}`);
    }
  };

  const showDeviceInstructions = () => {
    const instructions = Platform.OS === 'ios' 
      ? `iOS Instructions:
1. Go to Settings > Notifications
2. Find "BioScreenMobile" or "Expo Go"
3. Make sure "Allow Notifications" is ON
4. Enable "Lock Screen", "Notification Center", and "Banners"
5. Turn OFF "Do Not Disturb"
6. Check if any Focus modes are active

Common Issues:
• Notifications only work on physical devices (not simulator)
• App must be in background for notifications to appear
• Check device volume and notification sounds`
      : `Android Instructions:
1. Go to Settings > Apps > BioScreenMobile
2. Tap "Notifications"
3. Make sure notifications are enabled
4. Check individual channels are enabled
5. Turn OFF "Do Not Disturb"
6. Disable battery optimization for this app

Common Issues:
• Some Android versions require additional permissions
• Battery optimization can prevent notifications
• Check notification channels in app settings`;

    Alert.alert('Device Setup Instructions', instructions);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Notification Troubleshooter</Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Current Status</Text>
          <Text style={styles.statusItem}>
            Permission: <Text style={[styles.statusValue, { color: permissionStatus === 'granted' ? '#34C759' : '#FF3B30' }]}>
              {permissionStatus}
            </Text>
          </Text>
          <Text style={styles.statusItem}>
            Scheduled: <Text style={styles.statusValue}>{scheduledCount}</Text>
          </Text>
          <Text style={styles.statusItem}>
            Platform: <Text style={styles.statusValue}>{Platform.OS}</Text>
          </Text>
          {lastTestResult ? (
            <Text style={styles.statusItem}>
              Last Test: <Text style={styles.statusValue}>{lastTestResult}</Text>
            </Text>
          ) : null}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={checkStatus}>
            <Text style={styles.buttonText}>Refresh Status</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.permissionButton]} 
            onPress={requestPermissions}
          >
            <Text style={styles.buttonText}>Request Permissions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={scheduleImmediateTest}
          >
            <Text style={styles.buttonText}>Test Notification (10 sec)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.clearButton]} 
            onPress={clearAll}
          >
            <Text style={styles.buttonText}>Clear All</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.helpButton]} 
            onPress={showDeviceInstructions}
          >
            <Text style={styles.buttonText}>Device Setup Help</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Testing Steps:</Text>
          <Text style={styles.instructionText}>1. Tap "Request Permissions" if needed</Text>
          <Text style={styles.instructionText}>2. Tap "Test Notification (10 sec)"</Text>
          <Text style={styles.instructionText}>3. Put app in background immediately</Text>
          <Text style={styles.instructionText}>4. Wait 10 seconds for notification</Text>
          <Text style={styles.instructionText}>5. If no notification, tap "Device Setup Help"</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statusItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  statusValue: {
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#34C759',
  },
  testButton: {
    backgroundColor: '#FF9500',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  helpButton: {
    backgroundColor: '#5856D6',
  },
  instructionsCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default NotificationTroubleshooter;
