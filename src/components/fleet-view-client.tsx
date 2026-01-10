
"use client";

import { useMemo, useState } from 'react';
import type { Vehicle } from '@/lib/types';
import dynamic from 'next/dynamic';
import { VehicleFilters } from './vehicle-filters';
import { RouteHistorySheet } from './route-history-sheet';
import { Button } from './ui/button';
import { ArrowLeft, HardDriveUpload, ListFilter, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VehicleList } from './vehicle-list';
import { Skeleton } from './ui/skeleton';
import { useFleet } from '@/context/fleet-context';
import { VehicleDetails } from './vehicle-details';
import { ClientOnly } from './client-only';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { AnimatePresence, motion } from 'framer-motion';

const FleetMap = dynamic(() => import('./fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});


interface FleetViewClientProps {
  apiKey: string;
}

export function FleetViewClient({ apiKey }: FleetViewClientProps) {
  const { state, dispatch, isLoadingVehicles, error } = useFleet();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();

  const {
    vehicles,
    statusFilter,
    routeHistoryVehicle,
    selectedVehicle,
    isMapDark,
    visibleVehicleIds,
    pinRotationMode
  } = state;

  const handleBackToFleet = () => {
    dispatch({ type: 'BACK_TO_FLEET' });
  };
  
  const onPanelLayout = (sizes: number[]) => {
    // When the resizable panel is collapsed, deselect the vehicle
    if (sizes.length > 1 && sizes[0] < 5) {
      if (selectedVehicle) {
        dispatch({ type: 'PAN_TO_VEHICLE', payload: null });
      }
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        An error occurred: {error.message}.
      </div>
    );
  }

  return (
    <ResizablePanelGroup 
        direction="horizontal"
        className="relative h-full w-full bg-background"
        onLayout={onPanelLayout}
    >
      <ResizablePanel 
        defaultSize={30} 
        minSize={20}
        collapsible={true}
        collapsedSize={0}
      >
        <div className="h-full w-full flex flex-col">
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
                                    <VehicleList onVehicleSelect={() => {}} />
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={70} minSize={30}>
        <div className="relative h-full w-full">
            <FleetMap apiKey={apiKey} />
            <div className="absolute top-0 left-0 p-4 z-10 w-full max-w-sm">
                <div className="bg-card/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-border/20">
                    <VehicleFilters />
                </div>
            </div>
             <AnimatePresence>
                {routeHistoryVehicle ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-4 right-4 z-10"
                    >
                        <Button onClick={handleBackToFleet} variant="secondary" className="shadow-lg">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Fleet View
                        </Button>
                    </motion.div>
                ) : null}
            </AnimatePresence>
            {state.isLoadingRoute && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-30">
                    <div className="flex items-center gap-2 text-foreground">
                        <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                        <p>Generating route...</p>
                    </div>
                </div>
            )}
            <RouteHistorySheet />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
