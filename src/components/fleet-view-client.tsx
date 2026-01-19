
'use client';

import { useState, useEffect } from 'react';
import type { Vehicle } from '@/lib/types';
import dynamic from 'next/dynamic';
import { VehicleFilters } from './vehicle-filters';
import { RouteHistorySheet } from './route-history-sheet';
import { Button } from './ui/button';
import { ArrowLeft, PanelLeft } from 'lucide-react';
import { VehicleList } from './vehicle-list';
import { Skeleton } from './ui/skeleton';
import { useFleet } from '@/context/fleet-context';
import { VehicleDetails } from './vehicle-details';
import { ClientOnly } from './client-only';
import { cn } from '@/lib/utils';

const FleetMap = dynamic(() => import('./fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});


interface FleetViewClientProps {
  apiKey: string;
}

export function FleetViewClient({ apiKey }: FleetViewClientProps) {
  const { state, dispatch, isLoadingVehicles, error } = useFleet();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const {
    vehicles,
    historyVehicle,
    selectedVehicle,
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
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        An error occurred: {error.message}.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex">
        {isPanelOpen && (
          <div
            className="h-full bg-background border-r flex-shrink-0 transition-all duration-300 w-[350px]"
          >
             <div className="h-full w-[350px] flex flex-col">
                {selectedVehicle ? (
                    <ClientOnly>
                        <VehicleDetails />
                    </ClientOnly>
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">Vehicles</h2>
                            <p className="text-sm text-muted-foreground">
                                {vehicles.length} vehicles available
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoadingVehicles ? (
                                <div className="p-4 flex flex-col gap-2">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                    ))}
                                </div>
                            ) : (
                                <VehicleList onVehicleSelect={() => {
                                    if (!isPanelOpen) setIsPanelOpen(true);
                                }} />
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}
      
      <div className="flex-1 relative h-full w-full">
          <FleetMap apiKey={apiKey} />

          <div className="absolute top-0 left-0 p-4 z-10">
              {!historyVehicle && (
                  <div
                      style={{ viewTransitionName: 'filters-transition' }}
                      className='flex gap-2 items-start'
                  >
                      <Button 
                          variant="secondary"
                          size="icon"
                          onClick={() => setIsPanelOpen(!isPanelOpen)} 
                          className='shadow-lg'
                      >
                          <PanelLeft className={cn("transition-transform", isPanelOpen && "rotate-180")} />
                      </Button>
                      <div className="bg-card/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-border/20 max-w-sm">
                          <VehicleFilters />
                      </div>
                  </div>
              )}

              {historyVehicle && !state.isLoadingRoute ? (
                  <div
                    style={{ viewTransitionName: 'back-button-transition' }}
                  >
                      <Button onClick={handleBackToFleet} variant="secondary" className="shadow-lg">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Fleet View
                      </Button>
                  </div>
              ) : null}
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
