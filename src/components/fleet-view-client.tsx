"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Vehicle, VehicleStatus } from '@/lib/types';
import { simulateVehicleTelemetry } from '@/ai/flows/simulate-vehicle-telemetry';
import { simulateRouteHistory } from '@/ai/flows/simulate-route-history';
import { FleetMap } from './fleet-map';
import { VehicleFilters } from './vehicle-filters';
import { VehicleDetailDialog } from './vehicle-detail-dialog';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FleetViewClientProps {
  initialVehicles: Vehicle[];
  apiKey: string;
}

export function FleetViewClient({ initialVehicles, apiKey }: FleetViewClientProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [routeHistoryVehicle, setRouteHistoryVehicle] = useState<Vehicle | null>(null);
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[] | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const updatedVehicles = await simulateVehicleTelemetry({ numberOfVehicles: 30 });
        setVehicles(updatedVehicles);
      } catch (error) {
        console.error("Failed to fetch vehicle telemetry:", error);
      }
    };
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 120000); // Update every 2 minutes

    return () => clearInterval(interval);
  }, []);

  const handleShowRouteHistory = async (vehicle: Vehicle) => {
    setSelectedVehicle(null); // Close dialog
    setIsLoadingRoute(true);
    setRouteHistoryVehicle(vehicle);
    try {
      const route = await simulateRouteHistory({
        vehicleId: vehicle.vehicleId,
        startLat: vehicle.latitude,
        startLng: vehicle.longitude,
      });
      setRoutePath(route);
    } catch (error) {
      console.error("Failed to fetch route history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load route history. Please try again.",
      });
      setRouteHistoryVehicle(null); // Exit route view on error
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleBackToFleet = () => {
    setRouteHistoryVehicle(null);
    setRoutePath(null);
    setSelectedVehicle(null);
  };

  const filteredVehicles = useMemo(() => {
    if (routeHistoryVehicle) {
      return [routeHistoryVehicle];
    }
    if (statusFilter === 'all') {
      return vehicles;
    }
    return vehicles.filter(v => v.status === statusFilter);
  }, [vehicles, statusFilter, routeHistoryVehicle]);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    if (routeHistoryVehicle) {
      // If in route view, clicking the pin does nothing for now
      return;
    }
    setSelectedVehicle(vehicle);
  };

  const handleDialogClose = () => {
    setSelectedVehicle(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      <header className="p-4 bg-card border-b border-border z-10 shadow-md">
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-4">
          {routeHistoryVehicle ? (
             <Button variant="ghost" onClick={handleBackToFleet}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Fleet
            </Button>
          ) : (
            <h1 className="text-xl font-bold text-foreground">FleetView</h1>
          )}
          
           <div className={routeHistoryVehicle ? 'invisible' : ''}>
            <VehicleFilters
              currentFilter={statusFilter}
              onFilterChange={setStatusFilter}
            />
          </div>
        </div>
      </header>
      <main className="flex-1 relative">
        {(isLoadingRoute) && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="flex items-center gap-2 text-foreground">
                    <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                    <p>Generating route...</p>
                </div>
            </div>
        )}
        <FleetMap
          apiKey={apiKey}
          vehicles={filteredVehicles}
          onVehicleSelect={handleVehicleSelect}
          selectedVehicle={routeHistoryVehicle || selectedVehicle}
          routePath={routePath}
        />
        <VehicleDetailDialog
          vehicle={selectedVehicle}
          isOpen={!!selectedVehicle}
          onOpenChange={(isOpen) => !isOpen && handleDialogClose()}
          onShowRouteHistory={handleShowRouteHistory}
        />
      </main>
    </div>
  );
}
