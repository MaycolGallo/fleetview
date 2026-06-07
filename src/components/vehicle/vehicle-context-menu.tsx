
'use client';

import { createPortal } from 'react-dom';
import React, { useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { History, MapPin, Info, Bell, Radar, Loader2 } from 'lucide-react';
import type { Vehicle } from '@/lib/types';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';

type VehicleAction = 'show-route-history' | 'center-map' | 'show-details' | 'track-vehicle' | 'list-incidencias';

export function VehicleContextMenu({
  vehicle,
  position,
  onClose,
}: {
  vehicle: Vehicle;
  position: { x: number; y: number };
  onClose: () => void;
}) {
    const [portalNode, setPortalNode] = React.useState<HTMLElement | null>(null);
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const isTracked = state.trackedVehicleIds?.includes(vehicle.id_vehiculo) || false;
    const [isPending, startTransition] = useTransition();

    React.useEffect(() => {
        setPortalNode(document.body);
    }, []);

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
        
        if (!isPending) onClose();
    };

    if (!portalNode) return null;

    const contextMenuItems = [
      { action: 'show-route-history' as VehicleAction, label: 'Historial de Ruta', icon: History },
      { action: 'list-incidencias' as VehicleAction, label: 'Lista de Incidencias', icon: Bell },
      { action: 'track-vehicle' as VehicleAction, label: isTracked ? 'Quitar del Dashboard' : 'Seguir en Dashboard', icon: Radar, destructive: isTracked },
      { action: 'center-map' as VehicleAction, label: 'Centrar en Mapa', icon: MapPin },
      { action: 'show-details' as VehicleAction, label: 'Detalles del Vehículo', icon: Info },
    ];

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
                className="fixed z-[52] bg-popover/95 backdrop-blur-md border border-border rounded-lg shadow-2xl p-1 min-w-[220px] animate-in fade-in zoom-in-95 duration-200"
                style={{ top: position.y, left: position.x }}
            >
                <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 mb-1 flex justify-between items-center">
                    {vehicle.placa}
                    {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
                <div className="flex flex-col gap-0.5">
                    {contextMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Button
                                key={item.action}
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                                className={`w-full justify-start font-medium h-9 px-3 ${item.destructive ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : ''}`}
                                onClick={() => handleAction(item.action)}
                            >
                                <Icon className="mr-3 h-4 w-4" />
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
