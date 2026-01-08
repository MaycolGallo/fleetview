
"use client";

import type { Vehicle } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { useFleet, statusDetailsMap } from "@/context/fleet-context";

interface VehicleListProps {
    onVehicleSelect: () => void;
}

export function VehicleList({ onVehicleSelect }: VehicleListProps) {
    const { state, dispatch } = useFleet();
    const { vehicles, statusFilter, selectedVehicle, visibleVehicleIds } = state;

    const handleSelect = (vehicle: Vehicle) => {
        dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        onVehicleSelect();
    };

    const handleVisibilityChange = (vehicleId: number) => {
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
                    const statusDetail = statusDetailsMap[vehicle.status];
                    const StatusIcon = statusDetail.icon;
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
                                aria-label={`Toggle visibility of ${vehicle.placa}`}
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
                                <StatusIcon className={cn("w-5 h-5 flex-shrink-0")} style={{color: statusDetail.color}} />
                                <div className="flex-1 truncate">
                                    <p className="font-semibold truncate">{vehicle.placa}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}
                                    </p>
                                </div>
                                <Badge variant="outline" className="capitalize text-xs h-5">
                                    {vehicle.velocidad} km/h
                                </Badge>
                            </button>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    )
}
