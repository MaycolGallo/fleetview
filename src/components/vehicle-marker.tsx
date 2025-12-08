
"use client";

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { History, MapPin, Info, Navigation, AlertCircle, Settings } from 'lucide-react';

export type VehicleAction = 
  | 'show-route-history'
  | 'center-map'
  | 'show-details'
  | 'track-vehicle'
  | 'view-alerts'
  | 'maintenance'
  // Add more action types as needed
  ;

interface VehicleMarkerProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onClick: () => void;
  onAction?: (action: VehicleAction, vehicle: Vehicle) => void;
}

const contextMenuItems = [
  { action: 'show-route-history' as VehicleAction, label: 'Show Route History', icon: History },
  { action: 'center-map' as VehicleAction, label: 'Center on Map', icon: MapPin },
  { action: 'show-details' as VehicleAction, label: 'Vehicle Details', icon: Info },
  { action: 'track-vehicle' as VehicleAction, label: 'Track Vehicle', icon: Navigation },
  { action: 'view-alerts' as VehicleAction, label: 'View Alerts', icon: AlertCircle },
  { action: 'maintenance' as VehicleAction, label: 'Maintenance Log', icon: Settings },
  // Add more menu items here
];

export function VehicleMarker({ 
  vehicle, 
  isSelected, 
  onClick, 
  onAction
}: VehicleMarkerProps) {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };

  const handleMenuAction = (action: VehicleAction) => {
    setContextMenuOpen(false);
    onAction?.(action, vehicle);
  };

  return (
    <>
      <AdvancedMarker
        position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
        onClick={(e) => {
          e.domEvent.stopPropagation();
          onClick();
        }}
      >
        <div onContextMenu={handleContextMenu}>
          <VehiclePin status={vehicle.status} isSelected={isSelected} />
        </div>
      </AdvancedMarker>

      {contextMenuOpen && (
        <div
          className="fixed z-50"
          style={{ 
            left: `${contextMenuPosition.x}px`, 
            top: `${contextMenuPosition.y}px` 
          }}
        >
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenuOpen(false)}
          />
          <div className="relative z-50 bg-popover border border-border rounded-md shadow-lg p-1 min-w-[200px]">
            <div className="px-2 py-1.5 text-sm font-semibold border-b border-border mb-1">
              {vehicle.vehicleId}
            </div>
            
            {contextMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.action}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleMenuAction(item.action)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
