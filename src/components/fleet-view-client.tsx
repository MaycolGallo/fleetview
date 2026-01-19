'use client';

import { useMemo, useState, useEffect } from 'react';
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
import { AnimatePresence, motion } from 'framer-motion';
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
    dispatch({ type: 'BACK_TO_FLEET' });
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
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 350, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full bg-background border-r flex-shrink-0"
          >
             <div className="h-full w-[350px] flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedVehicle ? 'details' : 'list'}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="h-full w-full"
                    >
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
                    </motion.div>
                </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex-1 relative h-full w-full">
          <FleetMap apiKey={apiKey} />

          <div className="absolute top-0 left-0 p-4 z-10 w-full flex items-start justify-between">
              <AnimatePresence>
                {!historyVehicle && (
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0, transition: { duration: 0.3 } }}
                        exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
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
                    </motion.div>
                )}
              </AnimatePresence>

               <AnimatePresence>
                  {historyVehicle ? (
                      <motion.div
                          initial={{ opacity: 0, y: -50 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                          exit={{ opacity: 0, y: -50, transition: { duration: 0.3 } }}
                      >
                          <Button onClick={handleBackToFleet} variant="secondary" className="shadow-lg">
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Fleet View
                          </Button>
                      </motion.div>
                  ) : null}
              </AnimatePresence>
          </div>

          <AnimatePresence>
            {state.isLoadingRoute && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-30"
                >
                    <div className="flex items-center gap-2 text-foreground">
                        <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                        <p>Generating route...</p>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          <RouteHistorySheet />
      </div>
    </div>
  );
}
