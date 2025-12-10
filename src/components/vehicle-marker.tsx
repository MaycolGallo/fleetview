
"use client";

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { History, MapPin, Info, Navigation, AlertCircle, Settings } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";


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
                className="fixed inset-0 z-[51]" 
                onClick={onClose} 
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            />
            <div
                className="fixed z-[52] bg-popover border border-border rounded-md shadow-lg p-1 min-w-[200px]"
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

function MobileContextMenuDrawer({
    isOpen,
    onOpenChange,
    vehicle,
    onAction,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    vehicle: Vehicle;
    onAction: (action: VehicleAction, vehicle: Vehicle) => void;
}) {
    const handleAction = (action: VehicleAction) => {
        onAction(action, vehicle);
        onOpenChange(false);
    };

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>{vehicle.vehicleId}</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 pt-0">
                    <div className="flex flex-col gap-1">
                         {contextMenuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Button
                                    key={item.action}
                                    variant="ghost"
                                    size="lg"
                                    className="w-full justify-start text-base py-6"
                                    onClick={() => handleAction(item.action)}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

export function VehicleMarker({ 
  vehicle, 
  isSelected, 
  onVehicleSelect,
  onAction
}: VehicleMarkerProps) {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile) return;
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };
  
  const handleLeftClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVehicleSelect(vehicle);
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    pressTimer.current = setTimeout(() => {
      if (isMobile) {
        setDrawerOpen(true);
      } else {
        const touch = e.touches[0];
        setContextMenuPosition({ x: touch.clientX, y: touch.clientY });
        setContextMenuOpen(true);
      }
    }, 500); // 500ms for a long press
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    // Cancel long press if finger moves
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleMenuAction = (action: VehicleAction, targetVehicle: Vehicle) => {
    setContextMenuOpen(false);
    onAction?.(action, targetVehicle);
  };

  return (
    <>
      <AdvancedMarker
        position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
        onClick={(e) => {
          // This onClick is for the AdvancedMarker itself, which can interfere with our custom logic
          // We let our own div's onClick handle it to prevent double-firing.
        }}
      >
        <div 
          onClick={handleLeftClick} 
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          <VehiclePin status={vehicle.status} isSelected={isSelected} />
        </div>
      </AdvancedMarker>

      {contextMenuOpen && !isMobile && (
        <ContextMenu
          vehicle={vehicle}
          position={contextMenuPosition}
          onAction={handleMenuAction}
          onClose={() => setContextMenuOpen(false)}
        />
      )}
      
      {isMobile && (
         <MobileContextMenuDrawer
            isOpen={drawerOpen}
            onOpenChange={setDrawerOpen}
            vehicle={vehicle}
            onAction={handleMenuAction}
        />
      )}
    </>
  );
}
