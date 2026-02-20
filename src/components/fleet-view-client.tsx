
'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { RouteHistorySheet } from './route/route-history-sheet';
import { Button } from './ui/button';
import { ArrowLeft, PanelLeft, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { VehiclePanelContent } from '@/components/vehicle/vehicle-panel-content';
import {
  NestedDrawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { format, fromUnixTime } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FleetMap = dynamic(() => import('./fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});


interface FleetViewClientProps {
  apiKey: string;
}

export function FleetViewClient({ apiKey }: FleetViewClientProps) {
  const { state, error } = useFleetState();
  const dispatch = useFleetDispatch();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const isMobile = useIsMobile();

  const {
    historyVehicle,
    routeGroups
  } = state;
  
  const [date, setDate] = useState<DateRange | undefined>();
  const [nestedDrawerOpen, setNestedDrawerOpen] = useState(false);

  useEffect(() => {
    if (routeGroups.length > 0) {
      const firstRecord = routeGroups[0].records[0];
      const lastGroup = routeGroups[routeGroups.length - 1];
      const lastRecord = lastGroup.records[lastGroup.records.length - 1];
      
      setDate({
        from: fromUnixTime(firstRecord.fecha),
        to: fromUnixTime(lastRecord.fecha),
      });
    }
  }, [routeGroups]);

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

  const handleFilterApply = useCallback(() => {
    // TODO: Implement actual filtering logic, e.g., dispatch an action
    console.log("Applying date range filter:", date);
    if (isMobile) {
      setNestedDrawerOpen(false);
    }
  }, [date, isMobile]);

  useEffect(() => {
    if (historyVehicle) {
      setIsPanelOpen(false);
    }
  }, [historyVehicle]);

  const handleBackToFleet = () => {
    // @ts-ignore
    if (document.startViewTransition) {
        // @ts-ignore
        document.startViewTransition(() => {
            dispatch({ type: 'BACK_TO_FLEET' });
        });
    } else {
        dispatch({ type: 'BACK_TO_FLEET' });
    }
  };

  const handleVehicleSelect = () => {
    if (isMobile) {
      // The sheet is already open, do nothing.
    } else {
      if (!isPanelOpen) setIsPanelOpen(true);
    }
  };
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        An error occurred: {error.message}.
      </div>
    );
  }

  const panelContent = <VehiclePanelContent onVehicleSelect={handleVehicleSelect} />;

  return (
    <div className="relative h-full w-full flex">
        {isMobile ? (
          <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
            <SheetContent side="left" className="w-[85%] max-w-sm p-0 border-r-0">
              {panelContent}
            </SheetContent>
          </Sheet>
        ) : (
          isPanelOpen && (
            <div
              className="h-full bg-background border-r flex-shrink-0 transition-all duration-300 w-[350px]"
            >
              <div className="h-full w-[350px] flex flex-col">
                {panelContent}
              </div>
            </div>
          )
        )}
      
      <div className="flex-1 relative h-full w-full">
          <FleetMap apiKey={apiKey} />

          <div className="absolute top-0 left-0 p-4 z-10 w-full">
            <div className='relative w-full h-12 flex justify-between'>
                <div className='flex gap-2 items-start'>
                    {!historyVehicle ? (
                        <div style={{ viewTransitionName: 'filters-transition' }}>
                            <Button 
                                variant="secondary"
                                size="icon"
                                onClick={() => setIsPanelOpen(!isPanelOpen)} 
                                className='shadow-lg'
                            >
                                <PanelLeft className={cn("transition-transform", isPanelOpen && "rotate-180")} />
                            </Button>
                        </div>
                    ) : null}

                    {historyVehicle && !state.isLoadingRoute ? (
                        <div style={{ viewTransitionName: 'back-button-transition' }} className="flex items-center gap-2">
                            <Button onClick={handleBackToFleet} variant="secondary" className="shadow-lg">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Fleet View
                            </Button>
                            <Button variant="secondary" size="icon" className="shadow-lg">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : null}
                </div>
                 {historyVehicle && !state.isLoadingRoute && isMobile ? (
                     <div className='flex items-start'>
                        <NestedDrawer open={nestedDrawerOpen} onOpenChange={setNestedDrawerOpen}>
                            <DrawerTrigger asChild>
                                <Button variant="secondary" size="icon" className="shadow-lg">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span className="sr-only">Filter by date</span>
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent>
                                <DrawerHandle />
                                    <div className="p-4 overflow-y-auto">
                                    <DrawerHeader className="p-0 text-left mb-4">
                                        <DrawerTitle>Filter Route History</DrawerTitle>
                                        <DrawerDescription>Select a date and time range.</DrawerDescription>
                                    </DrawerHeader>
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={1}
                                        className='p-0 [&_td]:w-full'
                                    />
                                    <div className='pt-4 space-y-4'>
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
                                        <Button onClick={handleFilterApply} className="w-full">Apply</Button>
                                    </div>
                                </div>
                            </DrawerContent>
                        </NestedDrawer>
                    </div>
                ) : null}
            </div>
          </div>

            {state.isLoadingRoute && (
                <div
                    style={{ viewTransitionName: 'loading-transition' }}
                    className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-30"
                >
                    <div className="flex items-center gap-2 text-foreground">
                        <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                        <p>Generating route...</p>
                    </div>
                </div>
            )}

          <RouteHistorySheet date={date} setDate={setDate} onApply={handleFilterApply}/>
      </div>
    </div>
  );
}
