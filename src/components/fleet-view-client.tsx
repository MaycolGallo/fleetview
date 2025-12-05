"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Vehicle, VehicleStatus } from '@/lib/types';
import { simulateVehicleTelemetry } from '@/ai/flows/simulate-vehicle-telemetry';
import { FleetMap } from './fleet-map';
import { VehicleFilters } from './vehicle-filters';
import { VehicleDetailDialog } from './vehicle-detail-dialog';

interface FleetViewClientProps {
  initialVehicles: Vehicle[];
  apiKey: string;
}

export function FleetViewClient({ initialVehicles, apiKey }: FleetViewClientProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = async () => {
    try {
      const updatedVehicles = await simulateVehicleTelemetry({ numberOfVehicles: 30 });
      setVehicles(updatedVehicles);
    } catch (error) {
      console.error("Failed to fetch vehicle telemetry:", error);
    }
  };

  useEffect(() => {
    fetchVehicles(); // Fetch initial data
    const interval = setInterval(fetchVehicles, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const filteredVehicles = useMemo(() => {
    if (statusFilter === 'all') {
      return vehicles;
    }
    return vehicles.filter(v => v.status === statusFilter);
  }, [vehicles, statusFilter]);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleDialogClose = () => {
    setSelectedVehicle(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      <header className="p-4 bg-card border-b border-border z-10 shadow-md">
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-xl font-bold text-foreground">FleetView</h1>
          <VehicleFilters
            currentFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
        </div>
      </header>
      <main className="flex-1 relative">
        <FleetMap
          apiKey={apiKey}
          vehicles={filteredVehicles}
          onVehicleSelect={handleVehicleSelect}
          selectedVehicle={selectedVehicle}
        />
        <VehicleDetailDialog
          vehicle={selectedVehicle}
          isOpen={!!selectedVehicle}
          onOpenChange={(isOpen) => !isOpen && handleDialogClose()}
        />
      </main>
    </div>
  );
}
