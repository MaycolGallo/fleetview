"use client";

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, Clock, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useRef } from 'react';

interface VehicleMarkerProps {
  vehicle: Vehicle;
  selectedVehicle: Vehicle | null;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onShowRouteHistory: (vehicle: Vehicle) => void;
}

const statusDetails = {
    'active': {
        icon: CheckCircle,
        className: 'text-green-500 bg-green-900/20 border-green-500/30',
        text: 'text-green-400'
    },
    'idle': {
        icon: Clock,
        className: 'text-amber-500 bg-amber-900/20 border-amber-500/30',
        text: 'text-amber-400'
    },
    'out-of-service': {
        icon: AlertCircle,
        className: 'text-red-500 bg-red-900/20 border-red-500/30',
        text: 'text-red-400'
    }
};

export function VehicleMarker({ vehicle, selectedVehicle, onVehicleSelect, onShowRouteHistory }: VehicleMarkerProps) {
  const isSelected = selectedVehicle?.vehicleId === vehicle.vehicleId;
  const status = statusDetails[vehicle.status];
  const StatusIcon = status.icon;
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  
  // Ref for the marker div to anchor the popover
  const markerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onVehicleSelect(null); // Close popover if it's open
    setDropdownOpen(true);
  };
  
  const handleLeftClick = () => {
    setDropdownOpen(false); // Close dropdown if it's open
    onVehicleSelect(vehicle);
  }

  return (
    <AdvancedMarker
      position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
    >
      {/* Popover for vehicle info (Left-click) */}
      <Popover open={isSelected} onOpenChange={(open) => onVehicleSelect(open ? vehicle : null)}>
        {/* Dropdown for route history (Right-click) */}
        <DropdownMenu open={isDropdownOpen} onOpenChange={setDropdownOpen}>
            
            {/* This is the visible element on the map */}
            <div
                ref={markerRef}
                onClick={handleLeftClick}
                onContextMenu={handleContextMenu}
                className="cursor-pointer"
                aria-label={`Vehicle ${vehicle.vehicleId}`}
            >
                <VehiclePin status={vehicle.status} isSelected={isSelected} />
            </div>

            {/* Popover Content */}
            <PopoverContent
                sideOffset={25}
                className="w-80 bg-card/95 backdrop-blur-sm border-primary/20"
                onOpenAutoFocus={(e) => e.preventDefault()}
                // We use a side effect to re-anchor if the selection changes
                // This is a workaround for shadcn popover not re-anchoring on open prop change
                // without a trigger interaction.
                onInteractOutside={() => onVehicleSelect(null)}
            >
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none text-xl">{vehicle.vehicleId}</h4>
                        <p className="text-sm text-muted-foreground">Vehicle Details</p>
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant="outline" className={cn("capitalize text-sm border", status.className, status.text)}>
                                <StatusIcon className="mr-2 h-4 w-4" />
                                {vehicle.status.replace('-', ' ')}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Latitude</span>
                            <span className="font-mono text-foreground">{vehicle.latitude.toFixed(6)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Longitude</span>
                            <span className="font-mono text-foreground">{vehicle.longitude.toFixed(6)}</span>
                        </div>
                    </div>
                </div>
            </PopoverContent>
            
            {/* Dropdown Content */}
            <DropdownMenuContent
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <DropdownMenuItem onClick={() => onShowRouteHistory(vehicle)}>
                    <Route className="mr-2 h-4 w-4" />
                    <span>Show Route History</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </Popover>
    </AdvancedMarker>
  );
}