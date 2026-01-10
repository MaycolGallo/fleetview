
'use client';

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import React, { useState, useRef, MouseEvent } from 'react';
import { Button } from "@/components/ui/button";
import { History, MapPin, Info, Navigation, AlertCircle, Settings, Gauge } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '../hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerPortal,
  DrawerOverlay,
  DrawerHandle
} from "@/components/ui/drawer";
import { useFleet, statusDetailsMap } from '@/context/fleet-context';
import { useAnimatedPosition } from '@/hooks/use-animated-position';
import { motion } from 'framer-motion';

type VehicleAction = 'show-route-history' | 'center-map' | 'show-details' | 'track-vehicle' | 'view-alerts' | 'maintenance';

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
  onClose,
}: {
  vehicle: Vehicle;
  position: { x: number; y: number };
  onClose: () => void;
}) {
    const [portalNode, setPortalNode] = React.useState<HTMLElement | null>(null);
    const { dispatch } = useFleet();

    React.useEffect(() => {
        setPortalNode(document.body);
    }, []);

    const handleAction = (action: VehicleAction) => {
        if (action === 'show-route-history') {
          dispatch({ type: 'START_ROUTE_LOADING', payload: vehicle });
        } else if (action === 'show-details') {
          dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        } else if (action === 'center-map') {
          dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        }
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
                    {vehicle.placa}
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
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    vehicle: Vehicle;
}) {
    const { dispatch } = useFleet();

    const handleAction = (action: VehicleAction) => {
        if (action === 'show-route-history') {
             dispatch({ type: 'START_ROUTE_LOADING', payload: vehicle });
        } else if (action === 'show-details') {
            dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        } else if (action === 'center-map') {
          dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        }
        onOpenChange(false);
    };

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
             <DrawerPortal>
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerHandle />
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{vehicle.placa}</DrawerTitle>
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
            </DrawerPortal>
        </Drawer>
    )
}

function MarkerWithEvents({ vehicle }: { vehicle: Vehicle }) {
  const { state, dispatch } = useFleet();
  const { selectedVehicle, pinRotationMode } = state;
  const isSelected = selectedVehicle?.id === vehicle.id;
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  const targetPosition = { lat: vehicle.lat, lng: vehicle.lng };
  const animatedPosition = useAnimatedPosition(targetPosition);
  
  const handleLeftClick = (e: google.maps.MapMouseEvent | MouseEvent) => {
    if ('domEvent' in e && e.domEvent) {
      e.domEvent.stopPropagation();
    } else if (e.stopPropagation) {
      e.stopPropagation();
    }
    dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile) return;
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };
  
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
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const color = statusDetailsMap[vehicle.status as keyof typeof statusDetailsMap]?.color || '#9E9E9E';

  return (
    <>
      <AdvancedMarker
        key={vehicle.id}
        position={animatedPosition}
        onClick={handleLeftClick}
        zIndex={isSelected ? 10 : 1}
      >
        <motion.div 
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            data-vehicle-id={vehicle.id}
            className="relative cursor-pointer flex justify-center items-center"
            animate={{ 
              scale: isSelected ? 1.2 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-10"
            >
                <div
                    style={{ backgroundColor: color }}
                    className="flex items-center gap-1 shadow-md rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap text-white"
                >
                    <Gauge className="w-3 h-3" />
                    <span>{vehicle.velocidad}</span>
                </div>
            </div>
          
          <VehiclePin 
            vehicle={vehicle}
            isSelected={isSelected} 
          />
        </motion.div>
      </AdvancedMarker>

       {contextMenuOpen && !isMobile && (
        <ContextMenu
          vehicle={vehicle}
          position={contextMenuPosition}
          onClose={() => setContextMenuOpen(false)}
        />
      )}
      
      {isMobile && (
         <MobileContextMenuDrawer
            isOpen={drawerOpen}
            onOpenChange={setDrawerOpen}
            vehicle={vehicle}
        />
      )}
    </>
  );
}

export const AnimatedVehicleMarker = React.memo(MarkerWithEvents);
