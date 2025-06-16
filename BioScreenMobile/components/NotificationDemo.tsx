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
import { useNotifications } from '../context/NotificationContext';
import { useQuickNotifications } from '../hooks/useQuickNotifications';
import NotificationManager from '../components/NotificationManager';
import NotificationDebugger from '../lib/notificationDebugger';
import NotificationTroubleshooter from '../components/NotificationTroubleshooter';

const NotificationDemo: React.FC = () => {
  const { hasPermission, isInitialized } = useNotifications();
  const {
    scheduleReminderIn,
    scheduleDailyMedication,
    schedulePeriodicScreening,
    scheduleAppointmentWithMultipleReminders,
    scheduleHealthCheckReminder,
  } = useQuickNotifications();

  const [showManager, setShowManager] = useState(false);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);

  const handleQuickTest = async () => {
    const logResult = await NotificationDebugger.scheduleTestWithLogging(1);
    Alert.alert('Test Notification Scheduled', logResult, [
      { text: 'OK' },
      { 
        text: 'Show Settings Help', 
        onPress: () => Alert.alert('Device Settings', NotificationDebugger.getDeviceSettingsHelp())
      }
    ]);
  };

  const handleDiagnostics = async () => {
    const diagnostics = await NotificationDebugger.runDiagnostics();
    Alert.alert('Notification Diagnostics', diagnostics);
  };

  const handleClearAll = async () => {
    const result = await NotificationDebugger.clearAllWithLogging();
    Alert.alert('Clear Notifications', result);
  };

  const handleScreeningReminder = async () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const ids = await schedulePeriodicScreening(
      'Annual Blood Test',
      12, // Every 12 months
      nextWeek,
      1 // Just one reminder for demo
    );
    
    if (ids.length > 0) {
      Alert.alert('Success', 'Screening reminder scheduled for next week!');
    } else {
      Alert.alert('Error', 'Failed to schedule screening reminder');
    }
  };

  const handleAppointmentReminder = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 30, 0, 0); // 2:30 PM tomorrow
    
    const ids = await scheduleAppointmentWithMultipleReminders(
      'Doctor Appointment at City Hospital',
      tomorrow,
      [
        { beforeMinutes: 60, message: 'In 1 hour you have: ' },
        { beforeMinutes: 15, message: 'In 15 minutes you have: ' },
      ]
    );
    
    if (ids.length > 0) {
      Alert.alert('Success', `Scheduled ${ids.length} appointment reminders!`);
    } else {
      Alert.alert('Error', 'Failed to schedule appointment reminders');
    }
  };

  const handleMedicationReminder = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const ids = await scheduleDailyMedication(
      'Vitamin D',
      '1000 IU',
      { hour: 8, minute: 0 }, // 8:00 AM
      tomorrow
    );
    
    if (ids.length > 0) {
      Alert.alert('Success', `Scheduled ${ids.length} daily medication reminders!`);
    } else {
      Alert.alert('Error', 'Failed to schedule medication reminders');
    }
  };

  const handleHealthCheckReminder = async () => {
    const ids = await scheduleHealthCheckReminder(35, ['smoking'], new Date());
    
    if (ids.length > 0) {
      Alert.alert('Success', `Scheduled ${ids.length} health check reminders based on age and risk factors!`);
    } else {
      Alert.alert('Error', 'Failed to schedule health check reminders');
    }
  };

  if (showManager) {
    return <NotificationManager />;
  }

  if (showTroubleshooter) {
    return <NotificationTroubleshooter />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Notification System Demo</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.statusText, { color: isInitialized ? '#007AFF' : '#FF3B30' }]}>
            {isInitialized ? 'Initialized' : 'Not Initialized'}
          </Text>
          <Text style={[styles.statusText, { color: hasPermission ? '#34C759' : '#FF3B30' }]}>
            {hasPermission ? 'Permission Granted' : 'No Permission'}
          </Text>
        </View>

        {!hasPermission && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Notification permissions are required to use these features.
              Please enable notifications in your device settings.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tests</Text>
          
          <TouchableOpacity 
            style={[styles.button, !hasPermission && styles.buttonDisabled]} 
            onPress={handleQuickTest}
            disabled={!hasPermission}
          >
            <Text style={styles.buttonText}>Schedule Test Notification (1 min)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.diagnosticButton]} 
            onPress={handleDiagnostics}
          >
            <Text style={styles.buttonText}>Run Diagnostics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.clearButton]} 
            onPress={handleClearAll}
          >
            <Text style={styles.buttonText}>Clear All Notifications</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Reminders</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.screeningButton, !hasPermission && styles.buttonDisabled]} 
            onPress={handleScreeningReminder}
            disabled={!hasPermission}
          >
            <Text style={styles.buttonText}>Schedule Screening Reminder</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.appointmentButton, !hasPermission && styles.buttonDisabled]} 
            onPress={handleAppointmentReminder}
            disabled={!hasPermission}
          >
            <Text style={styles.buttonText}>Schedule Appointment Reminder</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.medicationButton, !hasPermission && styles.buttonDisabled]} 
            onPress={handleMedicationReminder}
            disabled={!hasPermission}
          >
            <Text style={styles.buttonText}>Schedule Medication Reminder</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.healthButton, !hasPermission && styles.buttonDisabled]} 
            onPress={handleHealthCheckReminder}
            disabled={!hasPermission}
          >
            <Text style={styles.buttonText}>Schedule Health Check Reminders</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.managerButton]} 
            onPress={() => setShowManager(true)}
          >
            <Text style={styles.buttonText}>Open Notification Manager</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.troubleshooterButton]} 
            onPress={() => setShowTroubleshooter(true)}
          >
            <Text style={styles.buttonText}>🔧 Troubleshooter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            • All notifications are local (no internet required){'\n'}
            • Scheduled notifications will trigger even when app is closed{'\n'}
            • Notifications include custom data for app navigation{'\n'}
            • Supports different types: screening, appointment, medication{'\n'}
            • Automatic permission handling and fallbacks{'\n'}
            • Persistent storage for notification management
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFA500',
    marginBottom: 20,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  screeningButton: {
    backgroundColor: '#34C759',
  },
  appointmentButton: {
    backgroundColor: '#FF9500',
  },
  medicationButton: {
    backgroundColor: '#5856D6',
  },
  healthButton: {
    backgroundColor: '#FF2D92',
  },
  managerButton: {
    backgroundColor: '#8E8E93',
  },
  troubleshooterButton: {
    backgroundColor: '#5856D6',
  },
  diagnosticButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    color: '#1976D2',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default NotificationDemo;
