/**
 * Format UTC ISO string to America/New_York timezone readable string
 */
export function formatZonedNY(dtISO: string): string {
  const date = new Date(dtISO);
  
  // Format in America/New_York timezone
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Convert datetime-local input value (interpreted as America/New_York time) to UTC ISO string
 * @param local - Value from <input type="datetime-local"> (format: "YYYY-MM-DDTHH:mm")
 * 
 * Note: datetime-local input gives us a value without timezone info.
 * We interpret it as America/New_York time, then convert to UTC for database storage.
 * 
 * Algorithm:
 * 1. Parse the input as NY time (year, month, day, hour, minute)
 * 2. Use reverse lookup: find the UTC timestamp that displays as this time in NY timezone
 * 3. We do this by testing UTC timestamps and checking what they display as in NY
 */
export function toUTCFromLocal(local: string): string {
  if (!local) return '';
  
  // Parse the local datetime
  const [datePart, timePart] = local.split('T');
  if (!datePart || !timePart) return '';
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create a date string in ISO format (without timezone)
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  
  // Use reverse lookup: find UTC time that displays as input time in NY
  // Start with an estimate: treat input as UTC, then adjust based on NY offset
  let testUTC = new Date(`${dateStr}Z`); // Start by treating as UTC
  
  // Get what this UTC time displays as in NY timezone
  let nyDisplay = testUTC.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Parse the NY display
  const [nyDatePart, nyTimePart] = nyDisplay.split(', ');
  const [nyMonth, nyDay, nyYear] = nyDatePart.split('/').map(Number);
  const [nyHour, nyMinute] = nyTimePart.split(':').map(Number);
  
  // Calculate the difference in minutes
  const targetMinutes = hours * 60 + minutes;
  const actualMinutes = nyHour * 60 + nyMinute;
  let diffMinutes = targetMinutes - actualMinutes;
  
  // Also check date difference
  const targetDate = new Date(year, month - 1, day).getTime();
  const actualDate = new Date(nyYear, nyMonth - 1, nyDay).getTime();
  const diffDays = Math.round((targetDate - actualDate) / (1000 * 60 * 60 * 24));
  
  // Adjust UTC time
  testUTC = new Date(testUTC.getTime() + diffMinutes * 60000 + diffDays * 24 * 60 * 60000);
  
  // Fine-tune with a few iterations (handles DST transitions)
  for (let i = 0; i < 5; i++) {
    nyDisplay = testUTC.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const [checkDatePart, checkTimePart] = nyDisplay.split(', ');
    const [checkMonth, checkDay, checkYear] = checkDatePart.split('/').map(Number);
    const [checkHour, checkMinute] = checkTimePart.split(':').map(Number);
    
    // Check if we match exactly
    if (
      checkYear === year &&
      checkMonth === month &&
      checkDay === day &&
      checkHour === hours &&
      checkMinute === minutes
    ) {
      break;
    }
    
    // Calculate new difference
    const checkMinutes = checkHour * 60 + checkMinute;
    const newDiffMinutes = targetMinutes - checkMinutes;
    
    const checkDate = new Date(checkYear, checkMonth - 1, checkDay).getTime();
    const newDiffDays = Math.round((targetDate - checkDate) / (1000 * 60 * 60 * 24));
    
    // Adjust
    testUTC = new Date(testUTC.getTime() + newDiffMinutes * 60000 + newDiffDays * 24 * 60 * 60000);
  }
  
  return testUTC.toISOString();
}

/**
 * Convert UTC ISO string to datetime-local input value (format: "YYYY-MM-DDTHH:mm")
 * The output will be in America/New_York timezone
 * @param utcISO - UTC ISO string (e.g., "2024-01-01T12:00:00Z")
 */
export function toLocalFromUTC(utcISO: string): string {
  if (!utcISO) return '';
  
  const date = new Date(utcISO);
  
  // Format in America/New_York timezone
  const nyString = date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Parse: "MM/DD/YYYY, HH:mm:ss" -> "YYYY-MM-DDTHH:mm"
  const [datePart, timePart] = nyString.split(', ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
