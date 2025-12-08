
"use client";

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { History } from 'lucide-react';

interface VehicleMarkerProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onClick: () => void;
  onShowRouteHistory: () => void;
}

export function VehicleMarker({ vehicle, isSelected, onClick, onShowRouteHistory }: VehicleMarkerProps) {
  
  return (
    <AdvancedMarker
      position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
      onClick={onClick}
    >
      <Popover>
        <PopoverTrigger asChild>
          <div onClick={(e) => e.stopPropagation()}>
            <VehiclePin status={vehicle.status} isSelected={isSelected} />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" onOpenAutoFocus={(e) => e.preventDefault()}>
          <Button variant="outline" size="sm" onClick={onShowRouteHistory}>
            <History className="mr-2 h-4 w-4" />
            Show Route History
          </Button>
        </PopoverContent>
      </Popover>
    </AdvancedMarker>
  );
}
