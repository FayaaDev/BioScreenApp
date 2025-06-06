export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    calendar: 'gregory'
  });
}

export function getTimeFromNow(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) {
    const pastDays = Math.abs(diffInDays);
    if (pastDays < 30) {
      return `${pastDays} days ago`;
    } else if (pastDays < 365) {
      const months = Math.floor(pastDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(pastDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  } else if (diffInDays === 0) {
    return 'Today';
  } else {
    if (diffInDays < 30) {
      return `In ${diffInDays} days`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `In ${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `In ${years} year${years > 1 ? 's' : ''}`;
    }
  }
}

export function isDue(dateString: string, daysThreshold: number = 30): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  return diffInDays <= daysThreshold;
}

export function isOverdue(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  
  return date < now;
}

export function getOverdueTime(userBirthDate: string, screeningStartAge: number): string {
  const birthDate = new Date(userBirthDate);
  const birthYear = birthDate.getFullYear();
  const currentYear = new Date().getFullYear();
  
  // Calculate the year when user turned the start age
  const targetYear = birthYear + screeningStartAge;
  
  // If user is not overdue (current year <= target year + 1), return appropriate message
  if (currentYear <= targetYear + 1) {
    return 'غير متأخر';
  }
  
  // Calculate how many years overdue
  const yearsOverdue = currentYear - (targetYear + 1);
  
  if (yearsOverdue === 1) {
    return 'متأخر سنة واحدة';
  } else {
    return `متأخر ${yearsOverdue} سنوات`;
  }
}
