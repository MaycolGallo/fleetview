"use client";

import { useState, useRef } from 'react';
import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, Clock, Route } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });

  const isSelected = selectedVehicle?.vehicleId === vehicle.vehicleId;
  const status = statusDetails[vehicle.status];
  const StatusIcon = status.icon;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setDropdownPosition({ x: e.clientX, y: e.clientY });
    setDropdownOpen(true);
  };
  
  return (
    <AdvancedMarker
      key={vehicle.vehicleId}
      position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
    >
      <Popover open={isSelected} onOpenChange={(open) => onVehicleSelect(open ? vehicle : null)}>
        <PopoverTrigger asChild>
          <div 
            onClick={() => onVehicleSelect(vehicle)}
            onContextMenu={handleContextMenu}
            className="cursor-pointer"
          >
            <VehiclePin status={vehicle.status} isSelected={isSelected} />
          </div>
        </PopoverTrigger>
        <PopoverContent
          sideOffset={25}
          className="w-80 bg-card/95 backdrop-blur-sm border-primary/20"
          onOpenAutoFocus={(e) => e.preventDefault()}
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
      </Popover>
        
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuContent 
          style={{
            position: 'fixed',
            top: dropdownPosition.y,
            left: dropdownPosition.x,
          }}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem onClick={() => onShowRouteHistory(vehicle)}>
            <Route className="mr-2 h-4 w-4" />
            <span>Show Route History</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </AdvancedMarker>
  );
}
