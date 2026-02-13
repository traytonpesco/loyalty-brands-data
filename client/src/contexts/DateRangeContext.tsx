import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface DateRange {
  startDate: string | null;
  endDate: string | null;
  preset?: string;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  clearDateRange: () => void;
  isFiltered: boolean;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

interface DateRangeProviderProps {
  children: ReactNode;
}

export function DateRangeProvider({ children }: DateRangeProviderProps) {
  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    // Load from localStorage
    try {
      const saved = localStorage.getItem('dateRange');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load date range from localStorage:', error);
    }
    return { startDate: null, endDate: null };
  });

  const setDateRange = (range: DateRange) => {
    // Validate dates
    if (range.startDate && range.endDate) {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid date format');
        return;
      }
      
      if (start > end) {
        console.error('Start date must be before end date');
        return;
      }
    }
    
    setDateRangeState(range);
  };

  const clearDateRange = () => {
    setDateRangeState({ startDate: null, endDate: null });
  };

  const isFiltered = Boolean(dateRange.startDate || dateRange.endDate);

  // Save to localStorage whenever dateRange changes
  useEffect(() => {
    try {
      localStorage.setItem('dateRange', JSON.stringify(dateRange));
    } catch (error) {
      console.error('Failed to save date range to localStorage:', error);
    }
  }, [dateRange]);

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange, clearDateRange, isFiltered }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
}

// Preset date range helpers
export const DATE_PRESETS = {
  today: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      preset: 'today'
    };
  },
  yesterday: () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      preset: 'yesterday'
    };
  },
  last7Days: () => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      preset: 'last7Days'
    };
  },
  last30Days: () => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      preset: 'last30Days'
    };
  },
  thisMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      preset: 'thisMonth'
    };
  },
  lastMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      preset: 'lastMonth'
    };
  },
};

export function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate || !endDate) return 'All Time';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);
  
  return `${startStr} - ${endStr}`;
}

