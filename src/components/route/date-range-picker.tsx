
'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    onApply: () => void;
}

export function DateRangePicker({
  className,
  date,
  setDate,
  onApply,
}: DateRangePickerProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const handleTimeChange = (type: 'from' | 'to', value: string) => {
    if (!value) return;
    const [hours, minutes] = value.split(':').map(Number);
    if (!date || (type === 'from' && !date.from) || (type === 'to' && !date.to)) return;

    if (type === 'from' && date.from) {
      const newFrom = new Date(date.from);
      newFrom.setHours(hours, minutes, 0, 0);
      setDate({ ...date, from: newFrom });
    }
    
    if (type === 'to' && date.to) {
      const newTo = new Date(date.to);
      newTo.setHours(hours, minutes, 0, 0);
      setDate({ ...date, to: newTo });
    }
  }
  
  const handleApply = () => {
    onApply();
    setPopoverOpen(false);
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[280px] justify-start text-left font-normal bg-card',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
          <div className='p-4 border-t space-y-4'>
            <div className="grid grid-cols-2 gap-4">
                <div className='space-y-2'>
                    <Label className='text-sm font-medium'>Start time</Label>
                    <Input 
                        type="time" 
                        defaultValue={date?.from ? format(date.from, 'HH:mm') : '00:00'}
                        onChange={(e) => handleTimeChange('from', e.target.value)}
                        disabled={!date?.from}
                    />
                </div>
                <div className='space-y-2'>
                    <Label className='text-sm font-medium'>End time</Label>
                    <Input 
                        type="time" 
                        defaultValue={date?.to ? format(date.to, 'HH:mm') : '23:59'}
                        onChange={(e) => handleTimeChange('to', e.target.value)}
                        disabled={!date?.to}
                    />
                </div>
            </div>
            <Button onClick={handleApply} className="w-full">Apply</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
