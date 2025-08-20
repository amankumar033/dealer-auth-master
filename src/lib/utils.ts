/**
 * Safely converts a value to a number, handling string decimals
 */
export function safeNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number as currency (INR)
 */
export function formatCurrency(value: string | number): string {
  const num = safeNumber(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats a number to 2 decimal places
 */
export function formatNumber(value: string | number): string {
  const num = safeNumber(value);
  return num.toFixed(2);
}

/**
 * Rounds a rating to the nearest 0.5 (e.g., 4.3 → 4.5, 4.8 → 5.0)
 */
export function roundRating(rating: number): number {
  return Math.round(rating * 2) / 2;
}

/**
 * Validates that sale price is less than original price
 */
export function validatePricing(salePrice: number, originalPrice: number): boolean {
  return salePrice < originalPrice;
}

/**
 * Gets current time in India/Delhi timezone in 24-hour format
 */
export function getIndiaTime(): string {
  const now = new Date();
  return now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Gets current timestamp in India/Delhi timezone for database
 */
export function getIndiaTimestamp(): string {
  const now = new Date();
  return now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6');
}

/**
 * Formats relative time for notifications (e.g., "2h 15m", "45m", "1d 3h")
 */
export function formatRelativeTime(createdAt: string | Date): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInMs = now.getTime() - created.getTime();
  
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 0) {
    const remainingHours = diffInHours % 24;
    if (remainingHours > 0) {
      return `${diffInDays}d ${remainingHours}h`;
    }
    return `${diffInDays}d`;
  }
  
  if (diffInHours > 0) {
    const remainingMinutes = diffInMinutes % 60;
    if (remainingMinutes > 0) {
      return `${diffInHours}h ${remainingMinutes}m`;
    }
    return `${diffInHours}h`;
  }
  
  if (diffInMinutes > 0) {
    return `${diffInMinutes}m`;
  }
  
  return 'Just now';
} 