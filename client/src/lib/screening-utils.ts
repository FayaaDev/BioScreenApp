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
