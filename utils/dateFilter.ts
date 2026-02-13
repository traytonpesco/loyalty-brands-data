import { Op } from 'sequelize';

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

export interface ParsedDateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Parse and validate date range from query parameters
 * @param startDate - ISO 8601 date string
 * @param endDate - ISO 8601 date string
 * @returns Parsed date range with Date objects
 * @throws Error if dates are invalid
 */
export function parseDateRange(startDate?: string, endDate?: string): ParsedDateRange | null {
  if (!startDate && !endDate) {
    return null;
  }

  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();

  // Validate dates
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)');
  }

  if (isNaN(end.getTime())) {
    throw new Error('Invalid end date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)');
  }

  // Ensure start is before end
  if (start > end) {
    throw new Error('Start date must be before or equal to end date');
  }

  // Check for future dates
  const now = new Date();
  if (start > now) {
    throw new Error('Start date cannot be in the future');
  }

  return { startDate: start, endDate: end };
}

/**
 * Generate Sequelize WHERE clause for date filtering
 * @param dateField - Name of the date field in the model
 * @param dateRange - Parsed date range
 * @returns Sequelize WHERE clause object
 */
export function buildDateWhereClause(dateField: string, dateRange: ParsedDateRange | null): any {
  if (!dateRange) {
    return {};
  }

  return {
    [dateField]: {
      [Op.gte]: dateRange.startDate,
      [Op.lte]: dateRange.endDate,
    },
  };
}

/**
 * Get preset date ranges
 */
export const DATE_PRESETS = {
  today: (): ParsedDateRange => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { startDate: start, endDate: end };
  },
  yesterday: (): ParsedDateRange => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
    const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
    return { startDate: start, endDate: end };
  },
  last7Days: (): ParsedDateRange => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return { startDate: start, endDate: end };
  },
  last30Days: (): ParsedDateRange => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return { startDate: start, endDate: end };
  },
  thisMonth: (): ParsedDateRange => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { startDate: start, endDate: end };
  },
  lastMonth: (): ParsedDateRange => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { startDate: start, endDate: end };
  },
};

/**
 * Get date range for comparison (previous period of same length)
 * @param dateRange - Current date range
 * @returns Previous period date range
 */
export function getPreviousPeriod(dateRange: ParsedDateRange): ParsedDateRange {
  const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
  const startDate = new Date(dateRange.startDate.getTime() - duration);
  const endDate = new Date(dateRange.endDate.getTime() - duration);
  return { startDate, endDate };
}

/**
 * Format date range for display
 * @param dateRange - Parsed date range
 * @returns Formatted string
 */
export function formatDateRange(dateRange: ParsedDateRange): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const start = dateRange.startDate.toLocaleDateString('en-US', options);
  const end = dateRange.endDate.toLocaleDateString('en-US', options);
  return `${start} - ${end}`;
}

