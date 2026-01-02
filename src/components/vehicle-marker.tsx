
'use client';

import type { Vehicle } from '@/lib/types';
import { useMap } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import React, { useState, useRef, useEffect } from 'react';
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
import { useFleet } from '@/context/fleet-context';
import { motion, useAnimate } from 'framer-motion';


export type VehicleAction = 
  | 'show-route-history'
  | 'center-map'
  | 'show-details'
  | 'track-vehicle'
  | 'view-alerts'
  | 'maintenance'
  ;

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
    const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
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
                    {vehicle.id}
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
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>{vehicle.id}</DrawerTitle>
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

function AnimatedVehicleMarker({ vehicle }: { vehicle: Vehicle }) {
  const map = useMap();
  const [scope, animate] = useAnimate();
  const [markerContainer, setMarkerContainer] = useState<HTMLElement | null>(null);

  const { state, dispatch } = useFleet();
  const { selectedVehicle } = state;
  const isSelected = selectedVehicle?.id === vehicle.id;
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();


  useEffect(() => {
    if (!map) return;
    // The Map instances provides a custom div to render markers on.
    // This is the recommended way to handle custom markers.
    const container = map.getDiv().querySelector<HTMLElement>('div[style="position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;"]');
    setMarkerContainer(container);
  }, [map]);


  useEffect(() => {
    if (!scope.current) return;

    const projection = map?.getProjection();
    const point = projection?.fromLatLngToDivPixel(
        new google.maps.LatLng(vehicle.latitude, vehicle.longitude)
    );

    if (point) {
        animate(scope.current, { 
          left: point.x, 
          top: point.y,
        }, {
          duration: 1, // Smooth transition for 1 second
          ease: 'easeInOut'
        });
    }

  }, [vehicle.latitude, vehicle.longitude, map, animate, scope]);
  
  
  const handleLeftClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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


  if (!markerContainer) return null;

  return createPortal(
    <>
      <motion.div
        ref={scope}
        className="absolute"
        style={{
          transform: 'translate(-50%, -100%)',
          zIndex: isSelected ? 10 : 1,
        }}
        animate={{ scale: isSelected ? 1.25 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
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
      </motion.div>

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
    </>,
    markerContainer
  );
}


export const VehicleMarker = React.memo(AnimatedVehicleMarker);
