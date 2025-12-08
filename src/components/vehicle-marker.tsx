
"use client";

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import React, { useState } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { History, MapPin, Info, Navigation, AlertCircle, Settings } from 'lucide-react';

export type VehicleAction = 
  | 'show-route-history'
  | 'center-map'
  | 'show-details'
  | 'track-vehicle'
  | 'view-alerts'
  | 'maintenance'
  ;

interface VehicleMarkerProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onVehicleSelect: (vehicle: Vehicle) => void;
  onAction?: (action: VehicleAction, vehicle: Vehicle) => void;
}

const contextMenuItems = [
  { action: 'show-route-history' as VehicleAction, label: 'Show Route History', icon: History },
  { action: 'center-map' as VehicleAction, label: 'Center on Map', icon: MapPin },
  { action: 'show-details' as VehicleAction, label: 'Vehicle Details', icon: Info },
  { action: 'track-vehicle' as VehicleAction, label: 'Track Vehicle', icon: Navigation },
  { action: 'view-alerts' as VehicleAction, label: 'View Alerts', icon: AlertCircle },
  { action: 'maintenance' as VehicleAction, label: 'Maintenance Log', icon: Settings },
];

export function VehicleMarker({ 
  vehicle, 
  isSelected, 
  onVehicleSelect,
  onAction
}: VehicleMarkerProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(true);
  };
  
  const handleLeftClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVehicleSelect(vehicle);
  }

  const handleMenuAction = (action: VehicleAction) => {
    onAction?.(action, vehicle);
    setIsMenuOpen(false);
  };

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <AdvancedMarker
          position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
        >
            <div onContextMenu={handleContextMenu} onClick={handleLeftClick}>
                <VehiclePin status={vehicle.status} isSelected={isSelected} />
            </div>
        </AdvancedMarker>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>{vehicle.vehicleId}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {contextMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.action}
              onClick={() => handleMenuAction(item.action)}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
