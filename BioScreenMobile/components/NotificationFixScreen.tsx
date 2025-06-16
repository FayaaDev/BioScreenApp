import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { NotificationDebugUtils } from '../lib/notificationDebugUtils';

const NotificationFixScreen: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Notifications',
      'This will cancel all scheduled notifications and reset the notification system. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await NotificationDebugUtils.clearAllNotifications();
              Alert.alert('Success', 'All notifications cleared!');
              await updateStatus();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear notifications');
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleRemoveDuplicates = async () => {
    setLoading(true);
    try {
      const removed = await NotificationDebugUtils.removeDuplicateNotifications();
      Alert.alert('Success', `Removed ${removed} duplicate notifications`);
      await updateStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove duplicates');
    }
    setLoading(false);
  };

  const handleLogNotifications = async () => {
    setLoading(true);
    try {
      await NotificationDebugUtils.logScheduledNotifications();
      Alert.alert('Success', 'Check console for notification details');
    } catch (error) {
      Alert.alert('Error', 'Failed to log notifications');
    }
    setLoading(false);
  };

  const updateStatus = async () => {
    setLoading(true);
    try {
      const newStatus = await NotificationDebugUtils.getNotificationStatus();
      setStatus(newStatus);
    } catch (error) {
      Alert.alert('Error', 'Failed to get status');
    }
    setLoading(false);
  };

  React.useEffect(() => {
    updateStatus();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Debug & Fix</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.sectionTitle}>Current Status</Text>
        {status && (
          <>
            <Text style={styles.statusText}>
              Scheduled Notifications: {status.scheduled}
            </Text>
            <Text style={styles.statusText}>
              Storage Keys: {status.storageKeys.length}
            </Text>
            <Text style={styles.statusText}>
              Permissions: {status.permissions?.status || 'Unknown'}
            </Text>
          </>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={updateStatus}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleRemoveDuplicates}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Remove Duplicates</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleLogNotifications}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Log to Console</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClearAll}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear All Notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Quick Fix for Your Issue:</Text>
        <Text style={styles.infoText}>
          1. Tap "Clear All Notifications" to reset everything{'\n'}
          2. Close and reopen the app{'\n'}
          3. The system will schedule only one notification per screening{'\n'}
          4. Check "Refresh Status" to verify
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
});

export default NotificationFixScreen;
