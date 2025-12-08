
"use client";

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import React from 'react';

interface VehicleMarkerProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onClick: () => void;
}

export function VehicleMarker({ vehicle, isSelected, onClick }: VehicleMarkerProps) {
  return (
    <AdvancedMarker
      position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
      onClick={(e) => {
        // Stop propagation to prevent map click from firing
        e.domEvent.stopPropagation();
        onClick();
      }}
    >
      <VehiclePin status={vehicle.status} isSelected={isSelected} />
    </AdvancedMarker>
  );
}
