import { isOverdue, isDue } from './date-utils';

export interface ScreeningWithDetails {
  id: number;
  userId: number;
  screeningId: number;
  lastCompleted: string | null;
  nextDue: string;
  status: string;
  screening: {
    id: number;
    name: string;
    description: string;
    category: string;
    genderApplicable: string;
    startAge: number;
    endAge: number | null;
    frequencyYears: number;
    isActive: boolean;
    iconUrl: string | null;
    priority: string;
  };
}

export function getScreeningStatusClass(status: string): string {
  switch (status) {
    case 'due':
      return 'screening-border-due status-due';
    case 'overdue':
      return 'screening-border-overdue status-overdue';
    case 'later':
    case 'laterRecreated':
      return 'screening-border-later status-later';
    case 'completed':
      return 'screening-border-completed status-completed';
    default:
      return 'screening-border-due status-due';
  }
}

export function getScreeningStatusLabel(status: string): string {
  switch (status) {
    case 'due':
      return 'بادر بحجز موعد فحص الان';
    case 'overdue':
      return 'متأخر';
    case 'later':
      return 'لم يحل موعده بعد';
    case 'laterRecreated':
      return 'لاحقاً';
    case 'completed':
      return 'مكتمل';
    default:
      return 'مستحق';
  }
}

export function getScreeningIcon(category: string): string {
  switch (category.toLowerCase()) {
    case 'cancer screening':
      return 'search';
    case 'cardiovascular':
      return 'heart';
    case 'bone health':
      return 'bone';
    case 'vision/hearing':
      return 'eye';
    case 'vaccinations':
      return 'shield';
    case 'preventive':
      return 'clipboard-check';
    default:
      return 'activity';
  }
}

export function calculateScreeningStats(screenings: ScreeningWithDetails[]) {
  const stats = {
    due: 0,
    overdue: 0,
    later: 0,
    completed: 0
  };

  screenings.forEach(screening => {
    switch (screening.status) {
      case 'due':
        stats.due++;
        break;
      case 'overdue':
        stats.overdue++;
        break;
      case 'later':
      case 'laterRecreated':
        stats.later++;
        break;
      case 'completed':
        stats.completed++;
        break;
    }
  });

  return stats;
}

export function filterScreeningsByStatus(screenings: ScreeningWithDetails[], status: string): ScreeningWithDetails[] {
  if (status === 'all') {
    return screenings;
  }
  if (status === 'later') {
    // For 'later' status, include both 'later' and 'laterRecreated'
    return screenings.filter(screening => screening.status === 'later' || screening.status === 'laterRecreated');
  }
  return screenings.filter(screening => screening.status === status);
}

export function groupScreeningsByCategory(screenings: ScreeningWithDetails[]): Record<string, ScreeningWithDetails[]> {
  return screenings.reduce((groups, screening) => {
    const category = screening.screening.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(screening);
    return groups;
  }, {} as Record<string, ScreeningWithDetails[]>);
}

// Color constants for React Native
export const STATUS_COLORS = {
  due: {
    background: '#E3F7F4',
    text: '#0EB39E',
    border: '#A1E4DC',
    icon: '#0EB39E'
  },
  overdue: {
    background: '#F4E6DD',
    text: '#A35829',
    border: '#E3C8B4',
    icon: '#A35829'
  },
  later: {
    background: 'rgba(255, 255, 255, 0.08)',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.16)',
    icon: '#FFFFFF'
  },
  completed: {
    background: '#f0fdf4', // green-50
    text: '#166534',       // green-800
    border: '#bbf7d0',     // green-200
    icon: '#166534'
  }
};

export function calculateNextDueDate(dateOfBirth: string, startAge: number): Date {
  const birthDate = new Date(dateOfBirth);
  const birthYear = birthDate.getFullYear();
  
  // Calculate the year when user turns the start age
  const targetYear = birthYear + startAge;
  
  // Always set to January 1st of target year
  return new Date(targetYear, 0, 1);
}

export function calculateScreeningStatus(dateOfBirth: string, startAge: number): "due" | "overdue" | "later" {
  const birthDate = new Date(dateOfBirth);
  const birthYear = birthDate.getFullYear();
  const currentYear = new Date().getFullYear();
  
  // Calculate the year when user turns the start age
  const targetYear = birthYear + startAge;
  
  // Determine status based on current date vs target date
  if (currentYear < targetYear) {
    // Before the target year - always "later"
    return "later";
  } else if (currentYear === targetYear || currentYear === targetYear + 1) {
    // User is AT StartAge or exactly one year past - "due"
    return "due";
  } else {
    // More than one year past start age - "overdue"
    return "overdue";
  }
} 