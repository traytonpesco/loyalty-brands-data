import React, { useState } from 'react';
import { Calendar, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useDateRange, DATE_PRESETS, formatDateRange } from '../contexts/DateRangeContext';

interface DateRangePickerProps {
  className?: string;
}

export default function DateRangePicker({ className = '' }: DateRangePickerProps) {
  const { dateRange, setDateRange, clearDateRange, isFiltered } = useDateRange();
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [compareMode, setCompareMode] = useState(false);

  const handlePresetClick = (presetKey: keyof typeof DATE_PRESETS) => {
    const preset = DATE_PRESETS[presetKey]();
    setDateRange(preset);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      setDateRange({
        startDate: new Date(customStart).toISOString(),
        endDate: new Date(customEnd).toISOString(),
        preset: 'custom'
      });
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearDateRange();
    setCustomStart('');
    setCustomEnd('');
    setCompareMode(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`justify-between ${className}`}
          style={{ minWidth: '250px' }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDateRange(dateRange.startDate, dateRange.endDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            {isFiltered && (
              <X 
                className="h-4 w-4 hover:bg-gray-200 rounded" 
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold mb-3">Quick Presets</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={!isFiltered ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  clearDateRange();
                  setIsOpen(false);
                }}
                className="justify-start col-span-2 bg-green-600 hover:bg-green-700 text-white"
              >
                📊 All Time
              </Button>
              <Button
                variant={dateRange.preset === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick('today')}
                className="justify-start"
              >
                Today
              </Button>
              <Button
                variant={dateRange.preset === 'yesterday' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick('yesterday')}
                className="justify-start"
              >
                Yesterday
              </Button>
              <Button
                variant={dateRange.preset === 'last7Days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick('last7Days')}
                className="justify-start"
              >
                Last 7 Days
              </Button>
              <Button
                variant={dateRange.preset === 'last30Days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick('last30Days')}
                className="justify-start"
              >
                Last 30 Days
              </Button>
              <Button
                variant={dateRange.preset === 'thisMonth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick('thisMonth')}
                className="justify-start"
              >
                This Month
              </Button>
              <Button
                variant={dateRange.preset === 'lastMonth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick('lastMonth')}
                className="justify-start"
              >
                Last Month
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-semibold mb-3">Custom Range</div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  max={customEnd || new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-xs">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                className="w-full"
                size="sm"
              >
                Apply Custom Range
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="rounded"
              />
              <span>Compare to previous period</span>
            </label>
            {compareMode && (
              <div className="mt-2 text-xs text-gray-500">
                Comparison view coming soon
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

