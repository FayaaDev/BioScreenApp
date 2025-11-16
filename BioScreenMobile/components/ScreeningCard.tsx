import React from 'react';
import { Image } from 'react-native';
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
  const isCompleted = screening.status === 'completed';

  // Helper function to get frequency text in Arabic
  const getFrequencyText = (years: number) => {
    if (i18n.language === 'ar') {
      if (years === 0) return t("screening.noRepetition");
      if (years === 1) return "كل سنة";
      if (years === 2) return "كل سنتين";
      return `كل ${years} سنين`;
    }
    return t("screening.everyYear", { count: years });
  };

  return (
    <View row>
      {/* Left border */}
      <View width={4} br40 backgroundColor={statusColors.border} marginR-s2 />
      <Card 
        flex
        padding-s4
        marginV-s2
        backgroundColor="white"
        enableShadow
        elevation={2}
      >  
        <View row centerV marginB-s2>
          <View 
            paddingH-14
            paddingV-5
            br40
            marginR-s2
            backgroundColor={statusColors.background}
            style={{ alignSelf: 'flex-start' }}
          > 
            <Text bodySmall color={statusColors.text} style={{ fontWeight: '600' }}> 
              {statusLabel}
            </Text>
          </View>
          <Text 
            body
            flex
            color="#1F2937"
            style={{ fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}
            numberOfLines={1}
          >
            {screening.screening?.name || 'Unknown Screening'}
          </Text>
        </View>
        
        <View row centerV marginB-s2>
          <View 
            width={40}
            height={40}
            br100
            center
            marginR-s3
            backgroundColor={statusColors.background}
          > 
            {screening.screening?.iconUrl ? (
              <Image 
                source={{ uri: screening.screening.iconUrl }}
                style={{ width: 28, height: 28, resizeMode: 'contain' }}
              />
            ) : (
              <MaterialCommunityIcons name={iconName} size={24} color={statusColors.icon} />
            )}
          </View>
          <Text 
            bodySmall
            flex
            color="#4B5563"
            style={{ textAlign: isRTL ? 'right' : 'left' }}
            numberOfLines={2}
          >
            {screening.screening?.description || 'No description available'}
          </Text>
        </View>
        
        <View row centerV marginB-s1>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
          <Text caption color="#4B5563" marginL-4>
            {screening.status === 'overdue' && userBirthDate
              ? getOverdueTime(userBirthDate, screening.screening?.startAge || 0)
              : getFrequencyText(screening.screening?.frequencyYears || 1)
            }
          </Text>
        </View>
        
        {screening.status === 'later' && screening.screening?.startAge && (
          <Text 
            caption
            color="#4B5563"
            marginB-s1
            style={{ textAlign: isRTL ? 'right' : 'left' }}
          >
            {t("screening.takeAtAge", { age: screening.screening.startAge })}
          </Text>
        )}
        
        {isCompleted && screening.screening?.frequencyYears && screening.screening.frequencyYears > 0 && (
          <Text 
            caption
            color="#4B5563"
            marginB-s1
            style={{ textAlign: isRTL ? 'right' : 'left' }}
          >
            {t("screening.nextDue", { date: formatDate(screening.nextDue) })}
          </Text>
        )}
        
        <View row marginT-s2 style={{ gap: 8 }}>
          {!isCompleted && (
            <Button 
              label={t("home.bookWithSehhaty")}
              size="xSmall"
              backgroundColor="primary"
              onPress={() => {
                const appLink = getSehhatyAppLink();
                if (onSchedule) onSchedule();
              }}
            />
          )}
          <Button 
            label={isCompleted ? "غير مكتمل" : t("home.markComplete")}
            size="xSmall"
            outline
            outlineColor="#555"
            backgroundColor="#2E3130"
            color="primary"
            onPress={onMarkCompleted}
          />
        </View>
      </Card>
    </View>
  );
}
