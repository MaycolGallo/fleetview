
"use client";

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';

interface VehicleMarkerProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onClick: () => void;
}

export function VehicleMarker({ vehicle, isSelected, onClick }: VehicleMarkerProps) {
  
  return (
      <AdvancedMarker
          position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
          onClick={onClick}
      >
          <div className="cursor-pointer">
            <VehiclePin status={vehicle.status} isSelected={isSelected} />
          </div>
      </AdvancedMarker>
  );
}
