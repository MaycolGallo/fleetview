
"use client";

import type { Vehicle, VehicleStatus } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock, EyeOff, Eye } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";

interface VehicleListProps {
    vehicles: Vehicle[];
    onVehicleSelect: (vehicle: Vehicle) => void;
    selectedVehicle: Vehicle | null;
    visibleVehicleIds: Set<string>;
    onVisibilityChange: (vehicleId: string) => void;
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

export function VehicleList({ vehicles, onVehicleSelect, selectedVehicle, visibleVehicleIds, onVisibilityChange }: VehicleListProps) {
    
    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-1 p-2">
                {vehicles.map(vehicle => {
                    const StatusIcon = statusDetails[vehicle.status].icon;
                    const isVisible = visibleVehicleIds.has(vehicle.vehicleId);
                    return (
                        <div
                            key={vehicle.vehicleId}
                            className={cn(
                                "flex items-center gap-3 p-2 rounded-md text-left transition-colors text-sm",
                                selectedVehicle?.vehicleId === vehicle.vehicleId && "bg-sidebar-accent text-sidebar-accent-foreground"
                            )}
                        >
                            <Checkbox
                                checked={isVisible}
                                onCheckedChange={() => onVisibilityChange(vehicle.vehicleId)}
                                aria-label={`Toggle visibility of ${vehicle.vehicleId}`}
                                className="flex-shrink-0"
                            />
                            <button
                                onClick={() => onVehicleSelect(vehicle)}
                                className={cn(
                                    "flex items-center gap-3 text-left transition-colors text-sm w-full",
                                    "hover:text-sidebar-accent-foreground rounded-md",
                                    !isVisible && "opacity-50"
                                )}
                                disabled={!isVisible}
                            >
                                <StatusIcon className={cn("w-5 h-5 flex-shrink-0", statusDetails[vehicle.status].className)} />
                                <div className="flex-1 truncate">
                                    <p className="font-semibold truncate">{vehicle.vehicleId}</p>
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
