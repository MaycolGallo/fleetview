"use client";

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';

interface VehicleMarkerProps {
  vehicle: Vehicle;
  selectedVehicle: Vehicle | null;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onContextMenu: (e: google.maps.MapMouseEvent) => void;
}

export function VehicleMarker({ vehicle, selectedVehicle, onVehicleSelect, onContextMenu }: VehicleMarkerProps) {
  const isSelected = selectedVehicle?.vehicleId === vehicle.vehicleId;
  
  return (
    <AdvancedMarker
      key={vehicle.vehicleId}
      position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
      onClick={() => onVehicleSelect(vehicle)}
      onContextMenu={onContextMenu}
    >
      <div className="cursor-pointer">
          <VehiclePin status={vehicle.status} isSelected={isSelected} />
      </div>
    </AdvancedMarker>
  );
}
