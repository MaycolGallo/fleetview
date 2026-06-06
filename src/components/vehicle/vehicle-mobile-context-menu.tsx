'use client';

import React, { useTransition } from 'react';
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
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { History, MapPin, Info, Bell, Radar, Loader2 } from 'lucide-react';
import type { Vehicle } from "@/lib/types";

type VehicleAction = 'show-route-history' | 'center-map' | 'show-details' | 'track-vehicle' | 'list-incidencias';

export function VehicleMobileContextMenu({
    isOpen,
    onOpenChange,
    vehicle,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    vehicle: Vehicle;
}) {
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const isTracked = state.trackedVehicleIds?.includes(vehicle.id_vehiculo) || false;
    const [isPending, startTransition] = useTransition();

    const handleViewTransition = (callback: () => void) => {
        // @ts-ignore
        if (typeof document !== 'undefined' && document.startViewTransition) {
            // @ts-ignore
            document.startViewTransition(callback);
            return;
        }
        callback();
    };

    const handleAction = (action: VehicleAction) => {
        startTransition(() => {
            switch (action) {
                case 'show-route-history':
                    handleViewTransition(() => dispatch({ type: 'START_ROUTE_LOADING', payload: vehicle }));
                    break;
                case 'list-incidencias':
                    handleViewTransition(() => dispatch({ type: 'START_INCIDENCIAS_LOADING', payload: vehicle }));
                    break;
                case 'track-vehicle':
                    dispatch({ type: 'TOGGLE_TRACK_VEHICLE', payload: vehicle.id_vehiculo });
                    break;
                case 'show-details':
                case 'center-map':
                    dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
                    break;
            }
        });
        
        if (!isPending) onOpenChange(false);
    };

    const contextMenuItems = [
      { action: 'show-route-history' as VehicleAction, label: 'Historial de Ruta', icon: History },
      { action: 'list-incidencias' as VehicleAction, label: 'Lista de Incidencias', icon: Bell },
      { action: 'track-vehicle' as VehicleAction, label: isTracked ? 'Quitar del Dashboard' : 'Seguir en Dashboard', icon: Radar, destructive: isTracked },
      { action: 'center-map' as VehicleAction, label: 'Centrar en Mapa', icon: MapPin },
      { action: 'show-details' as VehicleAction, label: 'Detalles del Vehículo', icon: Info },
    ];

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
             <DrawerPortal>
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerHandle />
                    <DrawerHeader className="text-left flex justify-between items-center">
                        <DrawerTitle>{vehicle.placa}</DrawerTitle>
                        {isPending && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
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
                                        disabled={isPending}
                                        className={`w-full justify-start text-base py-6 ${item.destructive ? 'text-destructive' : ''}`}
                                        onClick={() => handleAction(item.action)}
                                    >
                                        <Icon className="mr-4 h-5 w-5" />
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
