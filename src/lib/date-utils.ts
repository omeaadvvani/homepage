// Date formatting utilities for VoiceVedic

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Handle DD-MM-YYYY format
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return formatDateObject(dateObj);
      }
      return dateString; // Return original if can't parse
    }
    return formatDateObject(date);
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return dateString;
  }
}

export function formatDateObject(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  // Add ordinal suffix to day
  const dayWithSuffix = getOrdinalSuffix(day);
  
  return `${dayWithSuffix} ${month} ${year}`;
}

export function formatDateTime(dateTimeString: string): string {
  try {
    // Handle DD-MM-YYYY HH:MM:SS format
    if (dateTimeString.includes('-') && dateTimeString.includes(':')) {
      const [datePart, timePart] = dateTimeString.split(' ');
      const [day, month, year] = datePart.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const formattedDate = formatDateObject(date);
      const formattedTime = formatTime(timePart);
      
      return `${formattedDate} at ${formattedTime}`;
    }
    
    // Handle ISO format
    const date = new Date(dateTimeString);
    if (!isNaN(date.getTime())) {
      const formattedDate = formatDateObject(date);
      const formattedTime = formatTime(date.toTimeString().split(' ')[0]);
      return `${formattedDate} at ${formattedTime}`;
    }
    
    return dateTimeString;
  } catch (error) {
    console.error('Error formatting date time:', dateTimeString, error);
    return dateTimeString;
  }
}

export function formatTime(timeString: string): string {
  try {
    if (!timeString) return '';
    
    // Handle HH:MM:SS format
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    }
    
    return timeString;
  } catch (error) {
    console.error('Error formatting time:', timeString, error);
    return timeString;
  }
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return `${day}th`;
  }
  
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

export function parseDateForAPI(dateString: string): string {
  try {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Handle DD/MM/YYYY format
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Handle DD-MM-YYYY format
    if (dateString.includes('-')) {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateString;
  } catch (error) {
    console.error('Error parsing date for API:', dateString, error);
    return dateString;
  }
} 