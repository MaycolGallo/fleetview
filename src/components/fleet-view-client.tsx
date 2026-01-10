

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
import { Input } from './ui/input';

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
    if (sizes.length > 1 && sizes[1] < 5) {
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
      <div className="relative h-full w-full bg-background flex">
        <aside className="w-80 border-r flex flex-col bg-card">
            <div className='p-4 space-y-4'>
                <div className='flex items-center gap-2'>
                    <Input placeholder="Search by list" />
                    <Button variant="outline" size="icon"><SlidersHorizontal className='w-4 h-4' /></Button>
                    <Button variant="outline" size="icon"><ListFilter className='w-4 h-4' /></Button>
                </div>
                <VehicleFilters />
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoadingVehicles ? (
                    <div className="p-2 flex flex-col gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-md">
                            <Skeleton className="w-24 h-16 rounded-md" />
                            <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                        ))}
                    </div>
                ) : (
                    <VehicleList onVehicleSelect={() => {}} />
                )}
            </div>
        </aside>
       
        <main className="flex-1 h-full w-full z-10">
          <FleetMap apiKey={apiKey} />
        </main>
        
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
  );
}
