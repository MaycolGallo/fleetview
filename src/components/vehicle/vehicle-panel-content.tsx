
'use client';

import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { ClientOnly } from '@/components/client-only';
import { Skeleton } from '@/components/ui/skeleton';
import { VehicleDetails } from '@/components/vehicle/vehicle-details';
import { VehicleList } from '@/components/vehicle/vehicle-list';
import { VehicleFilters } from '@/components/vehicle/vehicle-filters';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronDown, LayoutPanelLeft, Radar, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface VehiclePanelContentProps {
    onVehicleSelect: () => void;
    onClose?: () => void;
}

export function VehiclePanelContent({ onVehicleSelect, onClose }: VehiclePanelContentProps) {
    const { state, isLoadingVehicles } = useFleetState();
    const dispatch = useFleetDispatch();
    const { selectedVehicle, vehicles, visibleVehicleIds, trackedVehicleIds } = state;
    const isMobile = useIsMobile();

    const allVisible = vehicles.length > 0 && vehicles.every(v => visibleVehicleIds.has(v.id_vehiculo));
    const someVisible = vehicles.some(v => visibleVehicleIds.has(v.id_vehiculo)) && !allVisible;

    const handleToggleAll = () => {
        const nextState = !allVisible;
        dispatch({ 
            type: 'SET_ALL_VEHICLES_VISIBILITY', 
            payload: { 
                ids: vehicles.map(v => v.id_vehiculo), 
                visible: nextState 
            } 
        });
    };

    const handleClearTracking = () => {
      dispatch({ type: 'SET_ALL_VEHICLES_VISIBILITY', payload: { ids: trackedVehicleIds, visible: false } });
    }

    if (selectedVehicle) {
        return (
            <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300">
                <ClientOnly>
                    <VehicleDetails />
                </ClientOnly>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            <div className="p-4 border-b space-y-4 bg-muted/20">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {!isMobile && onClose && (
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-muted border-primary/20 shadow-sm transition-all active:scale-95"
                                onClick={onClose}
                                title="Cerrar panel"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="flex items-center gap-2">
                            <LayoutPanelLeft className="w-5 h-5 text-primary" />
                            <div>
                                <h2 className="text-lg font-bold leading-tight">Flota</h2>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                    {vehicles.length} Vehículos
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {trackedVehicleIds.length > 0 && (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-7 text-[10px] px-2 font-bold"
                            onClick={handleClearTracking}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Limpiar Mini-Maps
                          </Button>
                        )}
                        <div className="flex items-center space-x-2 bg-background/50 border px-2 py-1 rounded-lg shadow-sm hover:bg-background transition-colors">
                            <Checkbox 
                                id="toggle-all" 
                                checked={allVisible} 
                                onCheckedChange={handleToggleAll}
                                className={cn(someVisible && "opacity-70")}
                            />
                            <Label htmlFor="toggle-all" className="text-xs font-bold cursor-pointer select-none">Todos</Label>
                        </div>
                        {isMobile && onClose && (
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-muted"
                                onClick={onClose}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                <div className="animate-in slide-in-from-top-2 duration-300">
                    <VehicleFilters />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoadingVehicles ? (
                    <div className="p-4 flex flex-col gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <VehicleList onVehicleSelect={onVehicleSelect} />
                )}
            </div>
        </div>
    );
}
