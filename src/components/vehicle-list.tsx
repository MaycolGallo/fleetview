
"use client";

import type { Vehicle } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { useFleet } from "@/context/fleet-context";

interface VehicleListProps {
    onVehicleSelect: () => void;
}

const statusDetails = {
    'active': {
        icon: CheckCircle,
        className: 'text-green-400',
    },
    'idle': {
        icon: Clock,
        className: 'text-amber-400',
    },
    'out-of-service': {
        icon: AlertCircle,
        className: 'text-red-400',
    }
};

export function VehicleList({ onVehicleSelect }: VehicleListProps) {
    const { state, dispatch } = useFleet();
    const { vehicles, statusFilter, selectedVehicle, visibleVehicleIds } = state;

    const handleSelect = (vehicle: Vehicle) => {
        dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        onVehicleSelect();
    };

    const handleVisibilityChange = (vehicleId: string) => {
        dispatch({ type: 'TOGGLE_VEHICLE_VISIBILITY', payload: vehicleId });
    };

    const listVehicles = useMemo(() => {
        if (statusFilter === 'all') {
            return vehicles;
        }
        return vehicles.filter(v => v.status === statusFilter);
    }, [vehicles, statusFilter]);
    
    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-1 p-2">
                {listVehicles.map(vehicle => {
                    const StatusIcon = statusDetails[vehicle.status].icon;
                    const isVisible = visibleVehicleIds.has(vehicle.id);
                    return (
                        <div
                            key={vehicle.id}
                            className={cn(
                                "flex items-center gap-3 p-2 rounded-md text-left transition-colors text-sm",
                                selectedVehicle?.id === vehicle.id && "bg-sidebar-accent text-sidebar-accent-foreground"
                            )}
                        >
                            <Checkbox
                                checked={isVisible}
                                onCheckedChange={() => handleVisibilityChange(vehicle.id)}
                                aria-label={`Toggle visibility of ${vehicle.id}`}
                                className="flex-shrink-0"
                            />
                            <button
                                onClick={() => handleSelect(vehicle)}
                                className={cn(
                                    "flex items-center gap-3 text-left transition-colors text-sm w-full",
                                    "hover:text-sidebar-accent-foreground rounded-md",
                                    !isVisible && "opacity-50"
                                )}
                                disabled={!isVisible}
                            >
                                <StatusIcon className={cn("w-5 h-5 flex-shrink-0", statusDetails[vehicle.status].className)} />
                                <div className="flex-1 truncate">
                                    <p className="font-semibold truncate">{vehicle.id}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                                    </p>
                                </div>
                                <Badge variant={
                                    vehicle.status === 'active' ? 'default' :
                                    vehicle.status === 'idle' ? 'secondary' : 'destructive'
                                } className="capitalize text-xs h-5">
                                    {vehicle.status.replace('-', ' ')}
                                </Badge>
                            </button>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    )
}
