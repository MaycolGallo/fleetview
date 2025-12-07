
"use client";

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Route } from 'lucide-react';
import React from 'react';

interface VehicleMarkerProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onClick: () => void;
  onShowRouteHistory: () => void;
}

export function VehicleMarker({ vehicle, isSelected, onClick, onShowRouteHistory }: VehicleMarkerProps) {
  
  const handleSelect = (e: Event) => {
    e.preventDefault();
    onShowRouteHistory();
  }

  // Clicks on the marker itself are for the InfoWindow (left-click)
  const handleMarkerClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // We prevent the event from propagating to the DropdownMenuTrigger
    e.stopPropagation();
    onClick();
  }

  return (
    <AdvancedMarker
      position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
      onClick={onClick}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer">
            <VehiclePin status={vehicle.status} isSelected={isSelected} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuItem onSelect={handleSelect}>
            <Route className="mr-2 h-4 w-4" />
            <span>Show Route History</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </AdvancedMarker>
  );
}
