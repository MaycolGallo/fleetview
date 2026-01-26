
'use client';

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerPortal,
  DrawerOverlay,
  DrawerHandle
} from "@/components/ui/drawer";
import { useFleetDispatch } from '@/context/fleet-context';
import { History, MapPin, Info, Navigation, AlertCircle, Settings } from 'lucide-react';
import type { Vehicle } from "@/lib/types";

type VehicleAction = 'show-route-history' | 'center-map' | 'show-details' | 'track-vehicle' | 'view-alerts' | 'maintenance';

const contextMenuItems = [
  { action: 'show-route-history' as VehicleAction, label: 'Show Route History', icon: History },
  { action: 'center-map' as VehicleAction, label: 'Center on Map', icon: MapPin },
  { action: 'show-details' as VehicleAction, label: 'Vehicle Details', icon: Info },
  { action: 'track-vehicle' as VehicleAction, label: 'Track Vehicle', icon: Navigation },
  { action: 'view-alerts' as VehicleAction, label: 'View Alerts', icon: AlertCircle },
  { action: 'maintenance' as VehicleAction, label: 'Maintenance Log', icon: Settings },
];

export function VehicleMobileContextMenu({
    isOpen,
    onOpenChange,
    vehicle,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    vehicle: Vehicle;
}) {
    const dispatch = useFleetDispatch();

    const handleAction = (action: VehicleAction) => {
        if (action === 'show-route-history') {
             // @ts-ignore
            if (document.startViewTransition) {
                // @ts-ignore
                document.startViewTransition(() => {
                    dispatch({ type: 'START_ROUTE_LOADING', payload: vehicle });
                });
            } else {
                dispatch({ type: 'START_ROUTE_LOADING', payload: vehicle });
            }
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
