
"use client";

import type { Vehicle, VehicleStatus } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "./ui/badge";

interface VehicleListProps {
    vehicles: Vehicle[];
    statusFilter: VehicleStatus | 'all';
    onVehicleSelect: (vehicle: Vehicle) => void;
    selectedVehicle: Vehicle | null;
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

export function VehicleList({ vehicles, statusFilter, onVehicleSelect, selectedVehicle }: VehicleListProps) {
    
    const filteredVehicles = useMemo(() => {
        if (statusFilter === 'all') {
            return vehicles;
        }
        return vehicles.filter(v => v.status === statusFilter);
    }, [vehicles, statusFilter]);
    
    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-1 p-2">
                {filteredVehicles.map(vehicle => {
                    const StatusIcon = statusDetails[vehicle.status].icon;
                    return (
                        <button
                            key={vehicle.vehicleId}
                            onClick={() => onVehicleSelect(vehicle)}
                            className={cn(
                                "flex items-center gap-3 p-2 rounded-md text-left transition-colors text-sm",
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                selectedVehicle?.vehicleId === vehicle.vehicleId && "bg-sidebar-accent text-sidebar-accent-foreground"
                            )}
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
                    )
                })}
            </div>
        </ScrollArea>
    )
}
