
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { RouteHistorySheet } from './route/route-history-sheet';
import { Button } from './ui/button';
import { ArrowLeft, PanelLeft } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { VehiclePanelContent } from '@/components/vehicle/vehicle-panel-content';

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
  } = state;

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

          <div className="absolute top-0 left-0 p-4 z-10 w-[calc(100%-2rem)]">
            <div className='relative w-full h-12'>
                {!historyVehicle ? (
                    <div style={{ viewTransitionName: 'filters-transition' }} className='flex gap-2 items-start absolute top-0 left-0'>
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
                    <div style={{ viewTransitionName: 'back-button-transition' }} className="absolute top-0 left-0">
                        <Button onClick={handleBackToFleet} variant="secondary" className="shadow-lg">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Fleet View
                        </Button>
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

          <RouteHistorySheet />
      </div>
    </div>
  );
}
