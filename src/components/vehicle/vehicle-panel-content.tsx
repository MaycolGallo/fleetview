
'use client';

import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { ClientOnly } from '@/components/client-only';
import { Skeleton } from '@/components/ui/skeleton';
import { VehicleDetails } from '@/components/vehicle/vehicle-details';
import { VehicleList } from '@/components/vehicle/vehicle-list';
import { VehicleFilters } from '@/components/vehicle/vehicle-filters';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface VehiclePanelContentProps {
    onVehicleSelect: () => void;
}

export function VehiclePanelContent({ onVehicleSelect }: VehiclePanelContentProps) {
    const { state, isLoadingVehicles } = useFleetState();
    const dispatch = useFleetDispatch();
    const { selectedVehicle, vehicles, visibleVehicleIds } = state;

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

    if (selectedVehicle) {
        return (
            <ClientOnly>
                <VehicleDetails />
            </ClientOnly>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-semibold">Vehicles</h2>
                        <p className="text-sm text-muted-foreground">
                            {vehicles.length} vehicles available
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 bg-muted/50 px-2 py-1 rounded-md">
                        <Checkbox 
                            id="toggle-all" 
                            checked={allVisible} 
                            onCheckedChange={handleToggleAll}
                            className={cn(someVisible && "opacity-70")}
                        />
                        <Label htmlFor="toggle-all" className="text-xs cursor-pointer">All</Label>
                    </div>
                </div>
                <VehicleFilters />
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoadingVehicles ? (
                    <div className="p-4 flex flex-col gap-2">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                ) : (
                    <VehicleList onVehicleSelect={onVehicleSelect} />
                )}
            </div>
        </div>
    );
}

// Helper to handle class merging
import { cn } from '@/lib/utils';
