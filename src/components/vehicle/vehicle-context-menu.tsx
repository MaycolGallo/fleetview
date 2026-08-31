
'use client';

import { createPortal } from 'react-dom';
import React, { useTransition, useState } from 'react';
import { Button } from "@/components/ui/button";
import { History, MapPin, Info, Bell, Radar, Loader2, Zap, Route } from 'lucide-react';
import { TestRouteMovementDialog } from './test-route-movement-dialog';
import type { Vehicle } from '@/lib/types';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { RemoteActionsModal } from './remote-actions-modal';
import { VehicleDetailsDialog } from './vehicle-details-dialog';

type VehicleAction = 'show-route-history' | 'center-map' | 'show-details' | 'track-vehicle' | 'list-incidencias' | 'remote-actions' | 'test-route-movement';

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
    const [remoteActionsOpen, setRemoteActionsOpen] = useState(false);
    const [vehicleDetailsOpen, setVehicleDetailsOpen] = useState(false);
    const [testRouteOpen, setTestRouteOpen] = useState(false);
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const isTracked = state.allTrackedVehicleIds?.includes(vehicle.id_vehiculo) || false;
    const [isPending, startTransition] = useTransition();

    React.useEffect(() => {
        setPortalNode(document.body);
    }, []);

    const handleAction = (action: VehicleAction) => {
        if (action === 'remote-actions') {
            onClose();
            setRemoteActionsOpen(true);
            return;
        }

        if (action === 'show-details') {
            onClose();
            setVehicleDetailsOpen(true);
            return;
        }

        if (action === 'test-route-movement') {
            onClose();
            setTestRouteOpen(true);
            return;
        }

        startTransition(() => {
            switch (action) {
                case 'show-route-history':
                    dispatch({ type: 'START_ROUTE_LOADING', payload: vehicle });
                    break;
                case 'list-incidencias':
                    dispatch({ type: 'START_INCIDENCIAS_LOADING', payload: vehicle });
                    break;
                case 'track-vehicle':
                    dispatch({ type: 'CREATE_MINIMAP', payload: { vehicleId: vehicle.id_vehiculo } });
                    break;
                case 'center-map':
                case 'show-details':
                    dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
                    break;
            }
        });
        
        onClose();
    };

    if (!portalNode) return null;

    const contextMenuItems = [
      { action: 'test-route-movement' as VehicleAction, label: 'Test route movement', icon: Route },
      { action: 'show-route-history' as VehicleAction, label: 'Historial de Ruta', icon: History },
      { action: 'list-incidencias' as VehicleAction, label: 'Lista de Incidencias', icon: Bell },
      { action: 'remote-actions' as VehicleAction, label: 'Ejecutar Acción Remota', icon: Zap },
      { action: 'track-vehicle' as VehicleAction, label: 'Crear Radar Lock', icon: Radar },
      { action: 'center-map' as VehicleAction, label: 'Centrar en Mapa', icon: MapPin },
      { action: 'show-details' as VehicleAction, label: 'Detalles del Vehículo', icon: Info },
    ];

    return createPortal(
        <>
            <RemoteActionsModal 
              vehicle={vehicle} 
              open={remoteActionsOpen} 
              onOpenChange={setRemoteActionsOpen} 
            />
            <VehicleDetailsDialog
              vehicle={vehicle}
              open={vehicleDetailsOpen}
              onOpenChange={setVehicleDetailsOpen}
            />
            <TestRouteMovementDialog
              vehicle={vehicle}
              open={testRouteOpen}
              onOpenChange={setTestRouteOpen}
            />
            {!vehicleDetailsOpen && !remoteActionsOpen && !testRouteOpen && (
              <div
                className="fixed inset-0 z-[51]"
                onClick={onClose}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
              />
            )}
            <div
                hidden={vehicleDetailsOpen || remoteActionsOpen || testRouteOpen}
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
                                className="w-full justify-start font-medium h-9 px-3"
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
