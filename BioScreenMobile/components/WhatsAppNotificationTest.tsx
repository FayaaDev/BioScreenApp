import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useNotifications } from '../context/NotificationContext';

const WhatsAppNotificationTest: React.FC = () => {
  const { 
    isInitialized, 
    hasPermission, 
    sendWelcomeMessage, 
    getNotificationStatus,
    scheduleScreeningReminder 
  } = useNotifications();
  
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const notificationStatus = await getNotificationStatus();
      setStatus(notificationStatus);
      Alert.alert('Status', JSON.stringify(notificationStatus, null, 2));
    } catch (error) {
      Alert.alert('Error', 'Failed to get notification status');
    } finally {
      setLoading(false);
    }
  };

  const testWelcomeMessage = async () => {
    setLoading(true);
    try {
      console.log('Testing welcome message for: +966562806025');
      // Use your actual phone number here - replace with your WhatsApp number
      const success = await sendWelcomeMessage('+966562806025', 'Test User');
      console.log('Welcome message result:', success);
      if (success) {
        Alert.alert('Success', 'Welcome message sent successfully via Twilio!');
      } else {
        Alert.alert('Error', 'Failed to send welcome message');
      }
    } catch (error) {
      console.error('Welcome message error:', error);
      Alert.alert('Error', `Failed to send welcome message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testScreeningReminder = async () => {
    setLoading(true);
    try {
      const reminderDate = new Date();
      reminderDate.setMinutes(reminderDate.getMinutes() + 1); // 1 minute from now
      
      const jobId = await scheduleScreeningReminder('Blood Test', reminderDate);
      if (jobId) {
        Alert.alert('Success', `Screening reminder scheduled with ID: ${jobId}`);
      } else {
        Alert.alert('Error', 'Failed to schedule screening reminder');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule screening reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Twilio WhatsApp Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Initialized:</Text>
        <Text style={[styles.statusText, { color: isInitialized ? '#34C759' : '#FF3B30' }]}>
          {isInitialized ? 'Yes' : 'No'}
        </Text>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Has Permission:</Text>
        <Text style={[styles.statusText, { color: hasPermission ? '#34C759' : '#FF3B30' }]}>
          {hasPermission ? 'Yes' : 'No'}
        </Text>
      </View>

      {status && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Server Status:</Text>
          <Text style={styles.statusText}>
            Twilio: {status.whatsappService?.initialized ? '✅' : '❌'}
          </Text>
          <Text style={styles.statusText}>
            Scheduler: {status.scheduler?.running ? '✅' : '❌'}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.button} 
        onPress={checkStatus}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Checking...' : 'Check Status'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testWelcomeMessage}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send Welcome Message'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testScreeningReminder}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Scheduling...' : 'Schedule Screening Reminder'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          • Welcome messages are sent immediately via Twilio WhatsApp API
        </Text>
        <Text style={styles.infoText}>
          • Screening reminders are scheduled on the server (1 minute for testing)
        </Text>
        <Text style={styles.infoText}>
          • Server checks for overdue screenings daily at 9 AM
        </Text>
        <Text style={styles.infoText}>
          • Messages are sent 7 days before due date by default
        </Text>
        <Text style={styles.infoText}>
          • Uses Twilio sandbox for testing (recipients must join)
        </Text>
      </View>

      <View style={styles.warningContainer}>
        <Text style={styles.warningTitle}>⚠️ Important Notes:</Text>
        <Text style={styles.warningText}>
          • For testing, recipients must join your Twilio WhatsApp sandbox
        </Text>
        <Text style={styles.warningText}>
          • Sandbox is limited to 1000 messages per month
        </Text>
        <Text style={styles.warningText}>
          • Production requires Twilio approval and setup
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 40,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#856404',
  },
  warningText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#856404',
  },
});

export default WhatsAppNotificationTest; 