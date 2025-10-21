/**
 * Time grid utilities for session management
 * All functions work with native Date objects
 */

/**
 * Get the start of the week (Monday) for a given date
 */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the week (Sunday) for a given date
 */
export function endOfWeekSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Format a date range label (e.g., "Oct 13 – Oct 19")
 */
export function formatRangeLabel(weekStart: Date, weekEnd: Date): string {
  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const endDay = weekEnd.getDate();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}`;
  } else {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  }
}

/**
 * Generate 30-minute time slots between dayStart and dayEnd (06:00–23:30)
 */
export function halfHourSlotsInRange(dayStart: Date, dayEnd: Date): Date[] {
  const slots: Date[] = [];
  const start = new Date(dayStart);
  start.setHours(6, 0, 0, 0); // 06:00
  
  const end = new Date(dayEnd);
  end.setHours(23, 30, 0, 0); // 23:30 (extended range)
  
  const current = new Date(start);
  while (current <= end) {
    slots.push(new Date(current));
    current.setMinutes(current.getMinutes() + 30);
  }
  
  return slots;
}

/**
 * Format time label (HH:mm)
 */
export function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

/**
 * Format day header (EEE M/d)
 */
export function formatDayHeader(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'numeric',
    day: 'numeric'
  });
}

/**
 * Get browser timezone label
 */
export function getBrowserTimezoneLabel(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Local Time';
  }
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Get all days in a week (Monday to Sunday)
 */
export function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push(day);
  }
  return days;
}
