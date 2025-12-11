
"use client";

import { useMemo, useState } from 'react';
import type { Vehicle } from '@/lib/types';
import dynamic from 'next/dynamic';
import { VehicleFilters } from './vehicle-filters';
import { RouteHistorySheet } from './route-history-sheet';
import { Button } from './ui/button';
import { ArrowLeft, PanelLeft, HardDriveUpload, DatabaseZap } from 'lucide-react';
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
import { simulateVehicleTelemetry } from '@/ai/flows/simulate-vehicle-telemetry';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

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
  const [isSeeding, setIsSeeding] = useState(false);
  const firestore = useFirestore();

  const {
    vehicles,
    statusFilter,
    routeHistoryVehicle,
    isMapDark,
    visibleVehicleIds,
  } = state;

  const { toast } = useToast();

  const handleBackToFleet = () => {
    dispatch({ type: 'BACK_TO_FLEET' });
  };
  
  const handleToggleAll = (isChecked: boolean) => {
    const vehicleIds = listVehicles.map(v => v.vehicleId);
    dispatch({ type: 'SET_ALL_VEHICLES_VISIBILITY', payload: { ids: vehicleIds, visible: isChecked } });
  };

  const handleMapThemeToggle = (isDark: boolean) => {
    dispatch({ type: 'SET_MAP_DARK_MODE', payload: isDark });
  }

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    toast({
      title: "Seeding Database...",
      description: "Generating and saving 50 vehicles. This may take a moment.",
    });

    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Firestore is not available.",
        });
        setIsSeeding(false);
        return;
    }


    try {
      // 1. Generate vehicle data using the Genkit flow
      const simulatedData = await simulateVehicleTelemetry({ numberOfVehicles: 50 });
      if (!simulatedData || simulatedData.length === 0) {
        throw new Error("Failed to generate vehicle data.");
      }

      // 2. Create a write batch
      const batch = writeBatch(firestore);
      const vehiclesCol = collection(firestore, 'vehicles');

      // 3. Add each vehicle to the batch
      simulatedData.forEach(vehicle => {
        const docData = {
          ...vehicle,
          driverName: `Driver ${Math.floor(Math.random() * 100)}`,
          speedKph: vehicle.status === 'active' ? Math.floor(Math.random() * 80) + 20 : 0,
          fuelLevel: Math.floor(Math.random() * 80) + 20,
          lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        const docRef = doc(firestore, 'vehicles', vehicle.vehicleId);
        batch.set(docRef, docData);
      });

      // 4. Commit the batch
      await batch.commit();

      toast({
        title: "Database Seeded!",
        description: `${simulatedData.length} vehicles have been successfully added to Firestore.`,
      });
      // Trigger a manual refresh or rely on the real-time listener to update
      dispatch({ type: 'SET_VEHICLES', payload: (await Promise.all(simulatedData.map(async v => ({...v}))) as Vehicle[]) });


    } catch (e: any) {
      console.error("Error seeding database:", e);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: e.message || "Could not seed the database.",
      });
    } finally {
      setIsSeeding(false);
      setPopoverOpen(false);
    }
  };
  
  const listVehicles = useMemo(() => {
     if (statusFilter === 'all') {
      return vehicles;
    }
    return vehicles.filter(v => v.status === statusFilter);
  }, [vehicles, statusFilter]);

  const areAllFilteredVisible = listVehicles.length > 0 && listVehicles.every(v => visibleVehicleIds.has(v.vehicleId));


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
                       <Separator />
                        <div className="p-2">
                           <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={handleSeedDatabase}
                              disabled={isSeeding}
                            >
                              <DatabaseZap className="mr-2 h-4 w-4" />
                              {isSeeding ? 'Seeding...' : 'Seed Database'}
                           </Button>
                        </div>
                    </PopoverContent>
                </Popover>

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
        <main className="h-full w-full z-10">
          <FleetMap apiKey={apiKey} />
        </main>
        
        <VehicleDetails />
        
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
