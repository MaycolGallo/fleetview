'use client';

import { useFleetState } from '@/context/fleet-context';
import { ClientOnly } from './client-only';
import { Skeleton } from './ui/skeleton';
import { VehicleDetails } from './vehicle-details';
import { VehicleList } from './vehicle-list';

interface VehiclePanelContentProps {
    onVehicleSelect: () => void;
}

export function VehiclePanelContent({ onVehicleSelect }: VehiclePanelContentProps) {
    const { state, isLoadingVehicles } = useFleetState();
    const { selectedVehicle, vehicles } = state;

    if (selectedVehicle) {
        return (
            <ClientOnly>
                <VehicleDetails />
            </ClientOnly>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Vehicles</h2>
                <p className="text-sm text-muted-foreground">
                    {vehicles.length} vehicles available
                </p>
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
