
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Vehicle, VehicleStatus, RouteEvent } from '@/lib/types';
import { simulateVehicleTelemetry } from '@/ai/flows/simulate-vehicle-telemetry';
import { simulateRouteHistory } from '@/ai/flows/simulate-route-history';
import { FleetMap } from './fleet-map';
import { VehicleFilters } from './vehicle-filters';
import { VehicleDetailDialog } from './vehicle-detail-dialog';
import { RouteHistorySheet } from './route-history-sheet';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { VehicleList } from './vehicle-list';
import { Separator } from './ui/separator';

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
  const [routeEvents, setRouteEvents] = useState<RouteEvent[]>([]);
  const [isRouteSheetOpen, setIsRouteSheetOpen] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeSegmentToFit, setRouteSegmentToFit] = useState<{ lat: number; lng: number }[] | null>(null);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<{ lat: number; lng: number }[] | null>(null);
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
      const { routePoints, routeEvents } = await simulateRouteHistory({
        vehicleId: vehicle.vehicleId,
        startLat: vehicle.latitude,
        startLng: vehicle.longitude,
      });
      setRoutePath(routePoints);
      setRouteEvents(routeEvents);
      setIsRouteSheetOpen(true);
      if (routePoints.length > 0) {
        setRouteSegmentToFit(routePoints);
      }
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
    setRouteEvents([]);
    setSelectedVehicle(null);
    setIsRouteSheetOpen(false);
    setRouteSegmentToFit(null);
    setHighlightedSegment(null);
    setSelectedSegmentIndex(null);
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
  
  const handleSegmentSelect = (segmentIndex: number) => {
    if (selectedSegmentIndex === segmentIndex) {
      // Deselect if clicking the same segment
      setSelectedSegmentIndex(null);
      setHighlightedSegment(null);
      setRouteSegmentToFit(routePath); // Fit entire route
      return;
    }

    setSelectedSegmentIndex(segmentIndex);
    if (!routePath || !routeEvents) return;

    // A simple heuristic to map events to points
    const pointsPerEvent = routeEvents.length > 1 ? Math.floor((routePath.length -1) / (routeEvents.length -1)) : routePath.length;
    const startPointIndex = segmentIndex * pointsPerEvent;
    const endPointIndex = (segmentIndex === routeEvents.length - 1) 
      ? routePath.length -1
      : (segmentIndex + 1) * pointsPerEvent;

    let segmentPoints: { lat: number; lng: number }[] = [];
    if (startPointIndex >= endPointIndex) {
      if (routePath[startPointIndex]) {
        segmentPoints = [routePath[startPointIndex]];
      }
    } else {
      segmentPoints = routePath.slice(startPointIndex, endPointIndex + 1);
    }

    setRouteSegmentToFit(segmentPoints.length > 0 ? segmentPoints : null);
    setHighlightedSegment(segmentPoints.length > 1 ? segmentPoints : null);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="relative h-screen w-screen bg-background">
        <Sidebar collapsible="icon" variant="floating">
          <SidebarContent>
            <SidebarHeader>
              <h2 className="font-semibold text-lg p-2">Vehicles</h2>
              <div className="px-2">
                <VehicleFilters
                  currentFilter={statusFilter}
                  onFilterChange={setStatusFilter}
                />
              </div>
            </SidebarHeader>
            <Separator />
            <VehicleList 
              vehicles={vehicles}
              statusFilter={statusFilter}
              onVehicleSelect={handleVehicleSelect}
              selectedVehicle={selectedVehicle}
            />
          </SidebarContent>
        </Sidebar>

        <header className="absolute top-0 left-0 right-0 p-2 md:p-4 bg-transparent z-20">
            <div className="container mx-auto flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-card p-2 rounded-lg shadow-md border">
                <SidebarTrigger />
                {routeHistoryVehicle ? (
                  <Button variant="ghost" onClick={handleBackToFleet}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Fleet
                  </Button>
                ) : (
                  <h1 className="text-xl font-bold text-foreground hidden md:block">FleetView</h1>
                )}
              </div>
            </div>
        </header>

        <main className="absolute inset-0 z-10">
          <FleetMap
            apiKey={apiKey}
            vehicles={filteredVehicles}
            onVehicleSelect={handleVehicleSelect}
            selectedVehicle={routeHistoryVehicle || selectedVehicle}
            routePath={routePath}
            highlightedSegment={highlightedSegment}
            routeSegmentToFit={routeSegmentToFit}
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
        <VehicleDetailDialog
          vehicle={selectedVehicle}
          isOpen={!!selectedVehicle}
          onOpenChange={(isOpen) => !isOpen && handleDialogClose()}
          onShowRouteHistory={handleShowRouteHistory}
        />
        <RouteHistorySheet
          isOpen={isRouteSheetOpen}
          onOpenChange={setIsRouteSheetOpen}
          events={routeEvents}
          vehicle={routeHistoryVehicle}
          onSegmentSelect={handleSegmentSelect}
          selectedSegmentIndex={selectedSegmentIndex}
        />
      </div>
    </SidebarProvider>
  );
}
