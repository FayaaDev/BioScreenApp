import React from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { View, Text, Card, Button } from 'react-native-ui-lib';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getScreeningStatusLabel, getScreeningIcon, STATUS_COLORS, type ScreeningWithDetails } from '../lib/screening-utils';
import { getTimeFromNow, formatDate, getOverdueTime } from '../lib/date-utils';
import { getSehhatyAppLink } from '../lib/device-utils';

interface ScreeningCardProps {
  screening: ScreeningWithDetails;
  onSchedule?: () => void;
  onMarkCompleted?: () => void;
  isRTL?: boolean;
  userBirthDate?: string;
}

const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  heart: 'heart',
  eye: 'eye',
  activity: 'pulse',
  search: 'magnify',
  shield: 'shield',
  'clipboard-check': 'clipboard-check',
  bone: 'bone',
};

export function ScreeningCard({ screening, onSchedule, onMarkCompleted, isRTL = false, userBirthDate }: ScreeningCardProps) {
  const { t, i18n } = useTranslation();
  const iconName = iconMap[getScreeningIcon(screening.screening?.category || 'general')] || 'pulse';
  const statusLabel = getScreeningStatusLabel(screening.status);
  const statusColors = STATUS_COLORS[screening.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.due;

  const timeFromNow = getTimeFromNow(screening.nextDue);
  <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
    {/* Left border */}
    <View style={{ width: 4, borderRadius: 4, backgroundColor: statusColors.border, marginRight: 8 }} />
    <View style={styles.card}>
      <View style={[styles.headerRow, isRTL && styles.rtlHeaderRow]}>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.background }]}>
          <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
            {statusLabel}
          </Text>
        </View>
        <Text style={[styles.title, isRTL && styles.rtlText]} numberOfLines={1}>
          {screening.screening?.name || 'Unknown Screening'}
        </Text>
      </View>
      <View style={[styles.iconAndDescRow, isRTL && styles.rtlIconAndDescRow]}>
        <View style={[styles.iconContainer, { backgroundColor: statusColors.background }]}>
          {screening.screening?.iconUrl ? (
            <Image
              source={{ uri: screening.screening.iconUrl }}
              style={styles.icon}
            />
          ) : (
            <MaterialCommunityIcons name={iconName} size={24} color={statusColors.icon} />
          )}
        </View>
        <Text style={[styles.description, isRTL && styles.rtlText]} numberOfLines={2}>
          {screening.screening?.description || 'No description available'}
        </Text>
      </View>
      <View style={[styles.timeInfo, isRTL && styles.rtlTimeInfo]}>
        <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
        <Text style={styles.timeText}>
          {screening.status === 'overdue' && userBirthDate
            ? getOverdueTime(userBirthDate, screening.screening?.startAge || 0)
            : getFrequencyText(screening.screening?.frequencyYears || 1)
          }
        </Text>
      </View>
      {screening.status === 'later' && screening.screening?.startAge && (
        <Text style={[styles.ageInfo, isRTL && styles.rtlText]}>
          {t("screening.takeAtAge", { age: screening.screening.startAge })}
        </Text>
      )}
      {isCompleted && screening.screening?.frequencyYears && screening.screening.frequencyYears > 0 && (
        <Text style={[styles.nextDue, isRTL && styles.rtlText]}>
          {t("screening.nextDue", { date: formatDate(screening.nextDue) })}
        </Text>
      )}
      <View style={[styles.actions]}>
        {!isCompleted && (
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => {
              const appLink = getSehhatyAppLink();
              if (onSchedule) onSchedule();
            }}
          >
            <Text style={styles.scheduleButtonText}>
              {t("home.bookWithSehhaty")}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.completeButton}
          onPress={onMarkCompleted}
        >
          <Text style={styles.completeButtonText}>
            {isCompleted ? t("screening.status.incomplete") : t("home.markComplete")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rtlHeaderRow: {
    // flexDirection: 'row-reverse',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 10,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    color: '#1F2937',
  },
  rtlText: {
    textAlign: 'right',
  },
  iconAndDescRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rtlIconAndDescRow: {
    // flexDirection: 'row-reverse',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 0,
  },
  icon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rtlTimeInfo: {
    // flexDirection: 'row-reverse',
  },
  timeText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },
  ageInfo: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 6,
  },
  nextDue: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  rtlActions: {
    // flexDirection: 'row-reverse',
  },
  scheduleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#4CCCE6', // Updated brand color
    marginRight: 8,
  },
  scheduleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  completeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#2E3130',
  },
  completeButtonText: {
    color: '#4CCCE6', // Updated brand color
    fontSize: 12,
  },
}); 