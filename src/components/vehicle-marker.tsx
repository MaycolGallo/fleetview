"use client";

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { History, MapPin, Info, Navigation, AlertCircle, Settings } from 'lucide-react';
import { createPortal } from 'react-dom';

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
];

function ContextMenu({
  vehicle,
  position,
  onAction,
  onClose,
}: {
  vehicle: Vehicle;
  position: { x: number; y: number };
  onAction: (action: VehicleAction, vehicle: Vehicle) => void;
  onClose: () => void;
}) {
    const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalNode(document.body);
    }, []);

    const handleAction = (action: VehicleAction) => {
        onAction(action, vehicle);
        onClose();
    };

    if (!portalNode) return null;

    return createPortal(
        <>
            <div 
                className="fixed inset-0 z-40" 
                onClick={onClose} 
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            />
            <div
                className="fixed z-50 bg-popover border border-border rounded-md shadow-lg p-1 min-w-[200px]"
                style={{ top: position.y, left: position.x }}
            >
                <div className="px-2 py-1.5 text-sm font-semibold border-b border-border mb-1">
                    {vehicle.vehicleId}
                </div>
                <div className="flex flex-col">
                    {contextMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Button
                                key={item.action}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => handleAction(item.action)}
                            >
                                <Icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </Button>
                        );
                    })}
                </div>
            </div>
        </>,
        portalNode
    );
}

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
  
  const handleLeftClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  }

  const handleMenuAction = (action: VehicleAction, targetVehicle: Vehicle) => {
    setContextMenuOpen(false);
    onAction?.(action, targetVehicle);
  };

  return (
    <>
      <AdvancedMarker
        position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
      >
        <div 
          onClick={handleLeftClick} 
          onContextMenu={handleContextMenu}
        >
          <VehiclePin status={vehicle.status} isSelected={isSelected} />
        </div>
      </AdvancedMarker>

      {contextMenuOpen && (
        <ContextMenu
          vehicle={vehicle}
          position={contextMenuPosition}
          onAction={handleMenuAction}
          onClose={() => setContextMenuOpen(false)}
        />
      )}
    </>
  );
}
