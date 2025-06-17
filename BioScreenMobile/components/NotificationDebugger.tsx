import React, { useState } from 'react';
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
import { useNotifications } from '../context/NotificationContext';
import { useScreeningNotifications } from '../hooks/useScreeningNotifications';
import { useNotificationEmergencyReset } from '../hooks/useNotificationEmergencyReset';
import { shouldScheduleNotifications, getNotificationReason, ScreeningData } from '../lib/notificationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationDebugger: React.FC = () => {
  const { hasPermission, getScheduledNotifications } = useNotifications();
  const { smartScheduleForScreening } = useScreeningNotifications();
  const { emergencyReset } = useNotificationEmergencyReset();
  const [debugInfo, setDebugInfo] = useState<string>('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => `[${timestamp}] ${message}\n${prev}`);
    console.log(message);
  };

  const testDueScreeningNotification = async () => {
    addLog('🧪 Testing DUE screening notification...');
    
    try {
      // Check notification settings
      const notificationsEnabled = await AsyncStorage.getItem('notifications_enabled');
      addLog(`📱 Notifications enabled: ${notificationsEnabled}`);
      addLog(`🔐 Has permission: ${hasPermission}`);
      
      if (!hasPermission) {
        Alert.alert('No Permission', 'Notification permissions are required for testing.');
        return;
      }

      // Create a test screening marked as "due"
      const testScreening = {
        id: 'test_due_screening',
        name: 'Test Blood Pressure Check',
        status: 'due' as const,
        nextDue: new Date().toISOString(), // Due now
        frequencyYears: 1,
      };

      addLog(`📋 Test screening: ${JSON.stringify(testScreening, null, 2)}`);

      // Try to schedule notifications
      const result = await smartScheduleForScreening(testScreening);
      addLog(`📬 Scheduling result: ${JSON.stringify(result)}`);

      // Check what was actually scheduled
      const scheduled = await getScheduledNotifications();
      const testNotifications = scheduled.filter(n => 
        n.content.title?.includes('Test Blood Pressure') ||
        n.content.body?.includes('Test Blood Pressure')
      );
      
      addLog(`✅ Found ${testNotifications.length} scheduled test notifications`);
      testNotifications.forEach((n, i) => {
        const trigger = n.trigger as any;
        const date = trigger?.date ? new Date(trigger.date).toLocaleString() : 'Unknown';
        addLog(`  ${i + 1}. "${n.content.title}" scheduled for ${date}`);
      });

      if (testNotifications.length > 0) {
        Alert.alert('Success', `Scheduled ${testNotifications.length} test notifications! Check the logs and device notifications.`);
      } else {
        Alert.alert('No Notifications', 'No test notifications were scheduled. Check the logs for details.');
      }

    } catch (error) {
      addLog(`❌ Error: ${error}`);
      Alert.alert('Error', `Failed to test: ${error}`);
    }
  };

  const testOverdueScreeningNotification = async () => {
    addLog('🧪 Testing OVERDUE screening notification...');
    
    try {
      const testScreening = {
        id: 'test_overdue_screening',
        name: 'Test Cholesterol Check',
        status: 'overdue' as const,
        nextDue: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        frequencyYears: 1,
      };

      addLog(`📋 Test overdue screening: ${JSON.stringify(testScreening, null, 2)}`);

      const result = await smartScheduleForScreening(testScreening);
      addLog(`📬 Overdue scheduling result: ${JSON.stringify(result)}`);

      Alert.alert('Test Completed', 'Check the logs and your device notifications for the overdue test.');

    } catch (error) {
      addLog(`❌ Error: ${error}`);
      Alert.alert('Error', `Failed to test: ${error}`);
    }
  };

  const checkAllScheduledNotifications = async () => {
    try {
      const scheduled = await getScheduledNotifications();
      addLog(`📱 Total scheduled notifications: ${scheduled.length}`);
      
      scheduled.forEach((n, i) => {
        const trigger = n.trigger as any;
        const date = trigger?.date ? new Date(trigger.date).toLocaleString() : 'Unknown';
        addLog(`  ${i + 1}. "${n.content.title}" - ${date}`);
      });

      Alert.alert('Scheduled Notifications', `Found ${scheduled.length} total scheduled notifications. Check logs for details.`);
    } catch (error) {
      addLog(`❌ Error checking notifications: ${error}`);
    }
  };

  const clearDebugLogs = () => {
    setDebugInfo('');
    addLog('🧹 Debug logs cleared');
  };

  const testNotificationLogic = async () => {
    addLog('🧪 Testing notification logic...');
    
    try {
      // Test different screening scenarios
      const testScreenings: ScreeningData[] = [
        {
          id: 'test_due',
          name: 'Blood Pressure Check',
          status: 'due',
          nextDue: new Date().toISOString(),
          frequencyYears: 1,
        },
        {
          id: 'test_overdue',
          name: 'Cholesterol Check',
          status: 'overdue',
          nextDue: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          frequencyYears: 1,
        },
        {
          id: 'test_later_soon',
          name: 'Mammogram',
          status: 'later',
          nextDue: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days
          frequencyYears: 2,
        },
        {
          id: 'test_later_far',
          name: 'Colonoscopy',
          status: 'later',
          nextDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          frequencyYears: 10,
        },
      ];

      addLog('📊 Testing notification logic for each screening:');
      
      testScreenings.forEach(screening => {
        const shouldSchedule = shouldScheduleNotifications(screening);
        const reason = getNotificationReason(screening);
        addLog(`  • ${screening.name} (${screening.status}): ${reason}`);
      });

      Alert.alert('Logic Test Complete', 'Check the logs to see how each screening type would be handled.');

    } catch (error) {
      addLog(`❌ Error testing logic: ${error}`);
    }
  };

  const clearDuplicateHypertensionNotifications = async () => {
    addLog('🧹 Clearing duplicate hypertension notifications...');
    
    try {
      const scheduled = await getScheduledNotifications();
      const hypertensionNotifications = scheduled.filter(n => 
        n.content.title?.includes('ضغط الدم') || 
        n.content.body?.includes('ضغط الدم')
      );
      
      addLog(`Found ${hypertensionNotifications.length} hypertension notifications to clear`);
      
      // Cancel all hypertension notifications
      for (const notification of hypertensionNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        addLog(`  ❌ Canceled: ${notification.content.title}`);
      }
      
      Alert.alert('Cleared', `Canceled ${hypertensionNotifications.length} duplicate hypertension notifications.`);
      
    } catch (error) {
      addLog(`❌ Error clearing notifications: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Notification Debugger</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Permission: {hasPermission ? '✅ Granted' : '❌ Denied'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.emergencyButton]} 
          onPress={() => {
            Alert.alert(
              'Emergency Reset',
              'This will cancel ALL notifications and clear the notification cache. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: emergencyReset }
              ]
            );
          }}
        >
          <Text style={styles.buttonText}>🚨 Emergency Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearDuplicateHypertensionNotifications}
        >
          <Text style={styles.buttonText}>🧹 Clear Duplicate ضغط الدم</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testDueScreeningNotification}>
          <Text style={styles.buttonText}>Test DUE Screening</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testOverdueScreeningNotification}>
          <Text style={styles.buttonText}>Test OVERDUE Screening</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.logicButton]} onPress={testNotificationLogic}>
          <Text style={styles.buttonText}>Test Notification Logic</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={checkAllScheduledNotifications}>
          <Text style={styles.buttonText}>Check All Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearDebugLogs}>
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Debug Logs:</Text>
        <ScrollView style={styles.logScroll}>
          <Text style={styles.logText}>{debugInfo || 'No logs yet...'}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF9500',
  },
  logicButton: {
    backgroundColor: '#5856D6',
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logScroll: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
});

export default NotificationDebugger;
