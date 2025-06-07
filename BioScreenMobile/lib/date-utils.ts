import { format, differenceInYears, differenceInMonths, differenceInDays, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export function isOverdue(date: string): boolean {
  const dueDate = parseISO(date);
  const today = new Date();
  return dueDate < today;
}

export function isDue(date: string): boolean {
  const dueDate = parseISO(date);
  const today = new Date();
  const diffDays = differenceInDays(dueDate, today);
  return diffDays >= 0 && diffDays <= 30;
}

export function getTimeFromNow(date: string): string {
  const targetDate = parseISO(date);
  const now = new Date();
  
  const years = differenceInYears(targetDate, now);
  const months = differenceInMonths(targetDate, now);
  const days = differenceInDays(targetDate, now);

  if (years > 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
}

export function formatDate(date: string, locale: string = 'en'): string {
  return format(parseISO(date), 'PPP', { locale: locale === 'ar' ? ar : enUS });
}

export function getOverdueTime(birthDate: string, startAge: number): string {
  const birth = parseISO(birthDate);
  const now = new Date();
  const age = differenceInYears(now, birth);
  
  if (age < startAge) {
    return `Due at age ${startAge}`;
  }
  
  const overdueYears = age - startAge;
  return `${overdueYears} ${overdueYears === 1 ? 'year' : 'years'} overdue`;
} 