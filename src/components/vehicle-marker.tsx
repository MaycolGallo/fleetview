
'use client';

import type { Vehicle, VehicleAction } from '@/lib/types';
import { useMap } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { History, MapPin, Info, Navigation, AlertCircle, Settings, Move } from 'lucide-react';
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
import { useFleet } from '@/context/fleet-context';
import { motion } from 'framer-motion';


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
             <DrawerPortal>
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerHandle />
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
            </DrawerPortal>
        </Drawer>
    )
}

// This is a wrapper for the AdvancedMarker that will host our custom animated div.
const CustomAdvancedMarker = (props: React.PropsWithChildren<{
    position: {lat: number, lng: number}
    onClick: (e: any) => void
    onContextMenu: (e: any) => void;
    vehicleId: string
}>) => {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const [markerContent, setMarkerContent] = useState<HTMLDivElement | null>(null);
    const map = useMap();

    useEffect(() => {
        if (!markerContent) {
            const div = document.createElement('div');
            div.setAttribute('data-vehicle-id', props.vehicleId);
            setMarkerContent(div);
            return;
        }

        if (!map) return;

        const marker = new google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: props.position,
            content: markerContent,
        });

        const clickListener = marker.addListener('click', props.onClick);
        
        // AdvancedMarkerElement doesn't have a built-in contextmenu event,
        // so we add it to the content div.
        markerContent.addEventListener('contextmenu', props.onContextMenu);


        markerRef.current = marker;

        return () => {
            if (markerRef.current) {
                clickListener.remove();
                markerContent.removeEventListener('contextmenu', props.onContextMenu);
                markerRef.current.map = null;
            }
        };
    }, [markerContent, map, props.vehicleId]);
    
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.position = props.position;
        }
    }, [props.position])


    return markerContent ? createPortal(props.children, markerContent) : null;
};


function MarkerWithEvents({ vehicle }: { vehicle: Vehicle }) {
  const { state, dispatch } = useFleet();
  const { selectedVehicle } = state;
  const isSelected = selectedVehicle?.id === vehicle.id;
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  const handleLeftClick = (e: google.maps.MapMouseEvent | React.MouseEvent) => {
    if ('domEvent' in e) {
      e.domEvent.stopPropagation();
    } else {
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


  return (
    <>
      <CustomAdvancedMarker
        key={vehicle.id}
        position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
        onClick={handleLeftClick}
        onContextMenu={handleContextMenu}
        vehicleId={vehicle.id}
      >
        <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: isSelected ? 1.2 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
        >
          <VehiclePin status={vehicle.status} isSelected={isSelected} />
        </motion.div>
      </CustomAdvancedMarker>

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

const AnimatedVehicleMarkerWrapper = ({ vehicle }: { vehicle: Vehicle }) => {
    const map = useMap();
    const [position, setPosition] = useState<google.maps.LatLng | null>(null);

    useEffect(() => {
        if(!map) return;
        const newPos = new google.maps.LatLng(vehicle.latitude, vehicle.longitude);
        setPosition(newPos);
    }, [vehicle.latitude, vehicle.longitude, map]);

    if (!map || !position) return null;

    return (
        <MarkerWithEvents vehicle={vehicle} />
    )
}


export const AnimatedVehicleMarker = React.memo(AnimatedVehicleMarkerWrapper);
