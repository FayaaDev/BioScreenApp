import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../context/NotificationContext';

interface NotificationSettings {
  screeningReminders: boolean;
  appointmentReminders: boolean;
  medicationReminders: boolean;
  generalReminders: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reminderFrequency: 'low' | 'medium' | 'high';
}

const defaultSettings: NotificationSettings = {
  screeningReminders: true,
  appointmentReminders: true,
  medicationReminders: true,
  generalReminders: true,
  soundEnabled: true,
  vibrationEnabled: true,
  reminderFrequency: 'medium',
};

const NotificationSettings: React.FC = () => {
  const { hasPermission, cancelAllNotifications } = useNotifications();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('notification_settings');
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleResetNotifications = () => {
    Alert.alert(
      'Reset All Notifications',
      'This will cancel all scheduled notifications and reset all settings to default. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAllNotifications();
              await saveSettings(defaultSettings);
              Alert.alert('Success', 'All notifications have been reset');
            } catch (error) {
              console.error('Error resetting notifications:', error);
              Alert.alert('Error', 'Failed to reset notifications');
            }
          },
        },
      ]
    );
  };

  const renderSettingRow = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    disabled: boolean = false
  ) => (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>{title}</Text>
        <Text style={[styles.settingDescription, disabled && styles.disabledText]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#767577', true: '#007AFF' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const renderFrequencySelector = () => (
    <View style={styles.frequencyContainer}>
      <Text style={styles.settingTitle}>Reminder Frequency</Text>
      <Text style={styles.settingDescription}>
        How often should we remind you about upcoming screenings?
      </Text>
      <View style={styles.frequencyButtons}>
        {([
          { key: 'low', label: 'Low', description: 'Only essential reminders' },
          { key: 'medium', label: 'Medium', description: 'Balanced reminders' },
          { key: 'high', label: 'High', description: 'All possible reminders' },
        ] as const).map(({ key, label, description }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.frequencyButton,
              settings.reminderFrequency === key && styles.frequencyButtonSelected,
            ]}
            onPress={() => updateSetting('reminderFrequency', key)}
            disabled={!hasPermission}
          >
            <Text
              style={[
                styles.frequencyButtonText,
                settings.reminderFrequency === key && styles.frequencyButtonTextSelected,
                !hasPermission && styles.disabledText,
              ]}
            >
              {label}
            </Text>
            <Text
              style={[
                styles.frequencyButtonDescription,
                settings.reminderFrequency === key && styles.frequencyButtonDescriptionSelected,
                !hasPermission && styles.disabledText,
              ]}
            >
              {description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Notification Settings</Text>

        {!hasPermission && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Notification permissions are disabled. Enable them in your device settings to use these features.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          {renderSettingRow(
            'Screening Reminders',
            'Get notified about upcoming health screenings and checkups',
            settings.screeningReminders,
            (value) => updateSetting('screeningReminders', value),
            !hasPermission
          )}
          
          {renderSettingRow(
            'Appointment Reminders',
            'Reminders for scheduled medical appointments',
            settings.appointmentReminders,
            (value) => updateSetting('appointmentReminders', value),
            !hasPermission
          )}
          
          {renderSettingRow(
            'Medication Reminders',
            'Daily reminders to take your medications',
            settings.medicationReminders,
            (value) => updateSetting('medicationReminders', value),
            !hasPermission
          )}
          
          {renderSettingRow(
            'General Reminders',
            'Other health-related notifications and tips',
            settings.generalReminders,
            (value) => updateSetting('generalReminders', value),
            !hasPermission
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Preferences</Text>
          
          {renderSettingRow(
            'Sound',
            'Play notification sounds',
            settings.soundEnabled,
            (value) => updateSetting('soundEnabled', value),
            !hasPermission
          )}
          
          {renderSettingRow(
            'Vibration',
            'Vibrate for notifications',
            settings.vibrationEnabled,
            (value) => updateSetting('vibrationEnabled', value),
            !hasPermission
          )}
        </View>

        <View style={styles.section}>
          {renderFrequencySelector()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          
          <TouchableOpacity style={styles.resetButton} onPress={handleResetNotifications}>
            <Text style={styles.resetButtonText}>Reset All Notifications</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>About Notifications</Text>
          <Text style={styles.infoText}>
            All notifications are stored locally on your device and don't require an internet connection. 
            You can customize which types of reminders you receive and how frequently you're notified.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
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
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  disabledText: {
    color: '#ccc',
  },
  frequencyContainer: {
    marginTop: 8,
  },
  frequencyButtons: {
    marginTop: 12,
  },
  frequencyButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  frequencyButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  frequencyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  frequencyButtonTextSelected: {
    color: '#fff',
  },
  frequencyButtonDescription: {
    fontSize: 14,
    color: '#666',
  },
  frequencyButtonDescriptionSelected: {
    color: '#fff',
    opacity: 0.9,
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    marginTop: 8,
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

export default NotificationSettings;
