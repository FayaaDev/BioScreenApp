import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNotifications } from '../context/NotificationContext';

interface ScheduledNotification extends Notifications.NotificationRequest {
  id: string;
}

const NotificationManager: React.FC = () => {
  const {
    hasPermission,
    scheduleScreeningReminder,
    scheduleAppointmentReminder,
    scheduleMedicationReminder,
    getScheduledNotifications,
    cancelNotification,
    cancelAllNotifications,
  } = useNotifications();

  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [notificationType, setNotificationType] = useState<'screening' | 'appointment' | 'medication'>('screening');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadScheduledNotifications();
  }, []);

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await getScheduledNotifications();
      const formattedNotifications = notifications.map((notification, index) => ({
        ...notification,
        id: notification.identifier || `notification_${index}`,
      }));
      setScheduledNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleScheduleNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (selectedDate <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }

    try {
      let notificationId: string | null = null;

      switch (notificationType) {
        case 'screening':
          notificationId = await scheduleScreeningReminder(title, selectedDate, { message });
          break;
        case 'appointment':
          notificationId = await scheduleAppointmentReminder(message, selectedDate, { title });
          break;
        case 'medication':
          const ids = await scheduleMedicationReminder(title, message, [selectedDate]);
          notificationId = ids[0] || null;
          break;
      }

      if (notificationId) {
        Alert.alert('Success', 'Notification scheduled successfully!');
        setShowModal(false);
        resetForm();
        loadScheduledNotifications();
      } else {
        Alert.alert('Error', 'Failed to schedule notification');
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  const handleCancelNotification = async (notificationId: string) => {
    Alert.alert(
      'Cancel Notification',
      'Are you sure you want to cancel this notification?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelNotification(notificationId);
              loadScheduledNotifications();
            } catch (error) {
              console.error('Error canceling notification:', error);
              Alert.alert('Error', 'Failed to cancel notification');
            }
          },
        },
      ]
    );
  };

  const handleCancelAllNotifications = () => {
    Alert.alert(
      'Cancel All Notifications',
      'Are you sure you want to cancel all scheduled notifications?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAllNotifications();
              loadScheduledNotifications();
            } catch (error) {
              console.error('Error canceling all notifications:', error);
              Alert.alert('Error', 'Failed to cancel all notifications');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setSelectedDate(new Date());
    setNotificationType('screening');
  };

  const formatDate = (date: Date | number) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleString();
  };

  const getNotificationTypeLabel = (data: any) => {
    if (data?.type === 'screening_reminder') return 'Screening';
    if (data?.type === 'appointment') return 'Appointment';
    if (data?.type === 'medication') return 'Medication';
    return 'General';
  };

  const renderNotificationItem = ({ item }: { item: ScheduledNotification }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.content.title}</Text>
        <Text style={styles.notificationBody}>{item.content.body}</Text>
        <Text style={styles.notificationDate}>
          {formatDate((item.trigger as any)?.date || new Date())}
        </Text>
        <Text style={styles.notificationType}>
          Type: {getNotificationTypeLabel(item.content.data)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => handleCancelNotification(item.identifier)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <Text style={styles.noPermissionText}>
            Notification permissions are required to use this feature.
          </Text>
          <Text style={styles.noPermissionSubtext}>
            Please enable notifications in your device settings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Manager</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
          {scheduledNotifications.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleCancelAllNotifications}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={scheduledNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No scheduled notifications</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Notification</Text>

            <View style={styles.typeSelector}>
              <Text style={styles.label}>Type:</Text>
              <View style={styles.typeButtons}>
                {(['screening', 'appointment', 'medication'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      notificationType === type && styles.typeButtonSelected,
                    ]}
                    onPress={() => setNotificationType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        notificationType === type && styles.typeButtonTextSelected,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title:</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter notification title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message:</Text>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Enter notification message"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date & Time:</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setSelectedDate(date);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.scheduleButton]}
                onPress={handleScheduleNotification}
              >
                <Text style={styles.scheduleButtonText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  notificationType: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noPermissionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  noPermissionSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  typeSelector: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelModalButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  scheduleButton: {
    backgroundColor: '#007AFF',
  },
  scheduleButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default NotificationManager;
