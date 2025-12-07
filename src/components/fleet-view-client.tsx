

"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Vehicle, VehicleStatus, RouteHistory } from '@/lib/types';
import { FleetMap } from './fleet-map';
import { VehicleFilters } from './vehicle-filters';
import { RouteHistorySheet } from './route-history-sheet';
import { Button } from './ui/button';
import { ArrowLeft, PanelLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VehicleList } from './vehicle-list';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from './ui/separator';
import { useFleetState } from '@/hooks/use-fleet-state';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';

interface FleetViewClientProps {
  apiKey: string;
}

async function fetchVehicles(): Promise<Vehicle[]> {
    const response = await fetch('/api/vehicles');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
}

async function fetchRouteHistory(vehicle: Vehicle): Promise<RouteHistory> {
  const response = await fetch('/api/routes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vehicleId: vehicle.vehicleId,
      startLat: vehicle.latitude,
      startLng: vehicle.longitude,
    }),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}


export function FleetViewClient({ apiKey }: FleetViewClientProps) {
  const { data: initialVehicles, isLoading: isLoadingVehicles, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  });

  const [state, dispatch] = useFleetState(initialVehicles || []);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const {
    vehicles,
    statusFilter,
    selectedVehicle,
    routeHistoryVehicle,
    routePath,
    routeEvents,
    isRouteSheetOpen,
    isLoadingRoute,
    routeSegmentToFit,
    selectedSegmentIndex,
    highlightedSegment,
    visibleVehicleIds,
    isMapDark,
  } = state;

  const { toast } = useToast();

  useEffect(() => {
    if (initialVehicles) {
      dispatch({ type: 'SET_VEHICLES', payload: initialVehicles });
    }
  }, [initialVehicles, dispatch]);

  const handleShowRouteHistory = async (vehicle: Vehicle) => {
    dispatch({ type: 'START_ROUTE_LOADING', payload: vehicle });
    try {
      const { routePoints, routeEvents } = await fetchRouteHistory(vehicle);
      dispatch({ type: 'SET_ROUTE_HISTORY', payload: { routePoints, routeEvents } });
    } catch (error) {
      console.error("Failed to fetch route history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load route history. Please try again.",
      });
      dispatch({ type: 'BACK_TO_FLEET' });
    }
  };

  const handleBackToFleet = () => {
    dispatch({ type: 'BACK_TO_FLEET' });
  };

  const filteredVehicles = useMemo(() => {
    if (routeHistoryVehicle) {
      return [routeHistoryVehicle];
    }
    return vehicles.filter(v => 
      visibleVehicleIds.has(v.vehicleId) &&
      (statusFilter === 'all' || v.status === statusFilter)
    );
  }, [vehicles, statusFilter, routeHistoryVehicle, visibleVehicleIds]);

  const listVehicles = useMemo(() => {
     if (statusFilter === 'all') {
      return vehicles;
    }
    return vehicles.filter(v => v.status === statusFilter);
  }, [vehicles, statusFilter]);

  const handleVehicleSelect = (vehicle: Vehicle | null) => {
    if (routeHistoryVehicle) {
      // Don't change selection if route history is active
      return;
    }
    dispatch({ type: 'SELECT_VEHICLE', payload: vehicle });
  };

  const handlePanToVehicle = (vehicle: Vehicle) => {
    dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
    setPopoverOpen(false);
  };

  const handleSegmentSelect = (segmentIndex: number) => {
    dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: segmentIndex });
  };

  const handleFilterChange = (filter: VehicleStatus | 'all') => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: filter });
  };

  const handleRouteSheetOpenChange = (isOpen: boolean) => {
    dispatch({ type: 'SET_ROUTE_SHEET_OPEN', payload: isOpen });
  }

  const handleVehicleVisibilityToggle = (vehicleId: string) => {
    dispatch({ type: 'TOGGLE_VEHICLE_VISIBILITY', payload: vehicleId });
  };

  const handleToggleAll = (isChecked: boolean) => {
    const vehicleIds = listVehicles.map(v => v.vehicleId);
    dispatch({ type: 'SET_ALL_VEHICLES_VISIBILITY', payload: { ids: vehicleIds, visible: isChecked } });
  };

  const handleMapThemeToggle = (isDark: boolean) => {
    dispatch({ type: 'SET_MAP_DARK_MODE', payload: isDark });
  }

  const areAllFilteredVisible = listVehicles.every(v => visibleVehicleIds.has(v.vehicleId));


  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        Error fetching vehicle data. Please try refreshing the page.
      </div>
    );
  }

  return (
      <div className="relative h-screen w-screen bg-background">
        <header className="absolute top-0 left-0 p-4 z-20">
          <div className="flex flex-col items-start gap-2">
            <div className="rounded-lg shadow-md border border-zinc-700 bg-zinc-900/90 backdrop-blur-sm p-1 flex flex-col gap-1">
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
                            <VehicleFilters
                                currentFilter={statusFilter}
                                onFilterChange={handleFilterChange}
                            />
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
                            <VehicleList 
                              vehicles={listVehicles}
                              onVehicleSelect={handlePanToVehicle}
                              selectedVehicle={selectedVehicle}
                              visibleVehicleIds={visibleVehicleIds}
                              onVisibilityChange={handleVehicleVisibilityToggle}
                            />
                          )}
                       </div>
                    </PopoverContent>
                </Popover>
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
          <FleetMap
            apiKey={apiKey}
            vehicles={filteredVehicles}
            onVehicleSelect={handleVehicleSelect}
            onShowRouteHistory={handleShowRouteHistory}
            selectedVehicle={routeHistoryVehicle || selectedVehicle}
            routePath={routePath}
            highlightedSegment={highlightedSegment}
            routeSegmentToFit={routeSegmentToFit}
            isMapDark={isMapDark}
          />
        </main>
        
        {(isLoadingRoute) && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-30">
                <div className="flex items-center gap-2 text-foreground">
                    <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                    <p>Generating route...</p>
                </div>
            </div>
        )}
        <RouteHistorySheet
          isOpen={isRouteSheetOpen}
          onOpenChange={handleRouteSheetOpenChange}
          events={routeEvents}
          vehicle={routeHistoryVehicle}
          onSegmentSelect={handleSegmentSelect}
          selectedSegmentIndex={selectedSegmentIndex}
        />
      </div>
  );
}
