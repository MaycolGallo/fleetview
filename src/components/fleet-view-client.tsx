
"use client";

import { useMemo, useState } from 'react';
import type { Vehicle } from '@/lib/types';
import dynamic from 'next/dynamic';
import { VehicleFilters } from './vehicle-filters';
import { RouteHistorySheet } from './route-history-sheet';
import { Button } from './ui/button';
import { ArrowLeft, PanelLeft, HardDriveUpload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VehicleList } from './vehicle-list';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFleet } from '@/context/fleet-context';
import { VehicleDetails } from './vehicle-details';
import { ClientOnly } from './client-only';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';

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
  } = state;

  const handleBackToFleet = () => {
    dispatch({ type: 'BACK_TO_FLEET' });
  };
  
  const handleToggleAll = (isChecked: boolean) => {
    const vehicleIds = listVehicles.map(v => v.id);
    dispatch({ type: 'SET_ALL_VEHICLES_VISIBILITY', payload: { ids: vehicleIds, visible: isChecked } });
  };

  const handleMapThemeToggle = (isDark: boolean) => {
    dispatch({ type: 'SET_MAP_DARK_MODE', payload: isDark });
  }
  
  const onPanelLayout = (sizes: number[]) => {
    if (sizes[1] < 10) {
      dispatch({ type: 'PAN_TO_VEHICLE', payload: null });
    }
  }

  const listVehicles = useMemo(() => {
     if (statusFilter === 'all') {
      return vehicles;
    }
    return vehicles.filter(v => v.status === statusFilter);
  }, [vehicles, statusFilter]);

  const areAllFilteredVisible = listVehicles.length > 0 && listVehicles.every(v => visibleVehicleIds.has(v.id));

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        An error occurred: {error.message}.
      </div>
    );
  }

  return (
      <div className="relative h-screen w-screen bg-background">
        <header className="absolute top-0 left-0 p-4 z-20">
          <div className="flex flex-col items-start gap-2">
            <div className="rounded-lg shadow-md border border-zinc-700 bg-zinc-900/90 backdrop-blur-sm p-1 flex items-start gap-1">
              <ClientOnly>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-zinc-700/80">
                            <PanelLeft />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start" sideOffset={8} className="w-80 p-0 bg-zinc-900/95 border-zinc-700 backdrop-blur-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
                       <div className="flex flex-col h-[60vh] max-h-[60vh]">
                          <div className="p-4 space-y-4">
                            <h2 className="font-semibold text-lg">Vehicles</h2>
                            <VehicleFilters />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="toggle-all"
                                      checked={areAllFilteredVisible}
                                      onCheckedChange={(checked) => handleToggleAll(Boolean(checked))}
                                    />
                                    <Label htmlFor="toggle-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {areAllFilteredVisible ? 'Hide All' : 'Show All'}
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch 
                                    id="dark-map" 
                                    checked={isMapDark}
                                    onCheckedChange={handleMapThemeToggle}
                                  />
                                  <Label htmlFor="dark-map">Dark Map</Label>
                                </div>
                            </div>
                          </div>
                          <Separator />
                          {isLoadingVehicles ? (
                            <div className="p-2 flex flex-col gap-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-md">
                                  <Skeleton className="w-5 h-5 rounded-full" />
                                  <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <VehicleList onVehicleSelect={() => setPopoverOpen(false)} />
                          )}
                       </div>
                    </PopoverContent>
                </Popover>
              </ClientOnly>

              <ClientOnly>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-zinc-700/80">
                        <HardDriveUpload />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Import Data</DialogTitle>
                      <DialogDescription>
                        Import vehicle and route data from a local file. This will overwrite existing data.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                       <p className="text-sm text-muted-foreground">
                         This feature is not yet implemented.
                       </p>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled>Import</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </ClientOnly>
            </div>
            
            {routeHistoryVehicle && (
              <div className="bg-background/80 backdrop-blur-sm p-1 rounded-lg shadow-md border border-border mt-2">
                  <Button variant="ghost" size="sm" onClick={handleBackToFleet}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Fleet
                  </Button>
              </div>
            )}
          </div>
        </header>

        <ClientOnly>
            <ResizablePanelGroup
                direction="horizontal"
                className="h-full w-full"
                onLayout={onPanelLayout}
            >
                <ResizablePanel defaultSize={100}>
                    <main className="h-full w-full z-10">
                      <FleetMap apiKey={apiKey} />
                    </main>
                </ResizablePanel>
                {selectedVehicle && <ResizableHandle withHandle />}
                {selectedVehicle && (
                    <ResizablePanel defaultSize={25} maxSize={30} minSize={20} collapsible={true} collapsedSize={0}>
                        <VehicleDetails />
                    </ResizablePanel>
                )}
            </ResizablePanelGroup>
        </ClientOnly>
        
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

    
