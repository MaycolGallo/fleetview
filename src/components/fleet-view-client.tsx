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

  const handleFilterApply = useCallback(() => {
    // TODO: Implement actual filtering logic, e.g., dispatch an action
    console.log("Applying date range filter:", date);
  }, [date]);

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
