
"use client";

import type { Vehicle } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import React, { useMemo, useCallback } from "react";
import { useFleetState, useFleetDispatch } from "@/context/fleet-context";
import { Car, Clock, Wifi, Battery, Radar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fromUnixTime, formatDistanceToNow } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VehicleListProps {
    onVehicleSelect: () => void;
}

const VehicleListItem = React.memo(({
    vehicle,
    isSelected,
    isVisible,
    isTracked,
    onSelect,
    onToggleVisibility,
    onToggleTrack,
}: {
    vehicle: Vehicle;
    isSelected: boolean;
    isVisible: boolean;
    isTracked: boolean;
    onSelect: (vehicle: Vehicle) => void;
    onToggleVisibility: (id: number) => void;
    onToggleTrack: (id: number) => void;
}) => {
    return (
        <div
            className={cn(
                "p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                isSelected ? "bg-accent border-primary ring-2 ring-primary/20 scale-[1.01] z-10" : "bg-card hover:bg-accent border-border hover:border-primary/50"
            )}
            onClick={() => onSelect(vehicle)}
        >
            <div className="flex flex-col gap-3 pt-1" onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                    checked={isVisible} 
                    onCheckedChange={() => onToggleVisibility(vehicle.id_vehiculo)}
                    aria-label={`Toggle visibility for ${vehicle.placa}`}
                />
                
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant={isTracked ? "default" : "ghost"} 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => onToggleTrack(vehicle.id_vehiculo)}
                        >
                            <Radar className={cn("h-4 w-4", isTracked && "animate-pulse")} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {isTracked ? "Stop tracking in mini-map" : "Track in mini-map"}
                    </TooltipContent>
                </Tooltip>
            </div>

            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{backgroundColor: vehicle.statusColor}}>
                            <Car className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold">{vehicle.placa}</p>
                            <p className="text-xs text-muted-foreground">{vehicle.statusName}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0 bg-background/50">{parseFloat(vehicle.velocidad).toFixed(0)} km/h</Badge>
                </div>
               
                <div className="flex justify-between items-center mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5" title="Last update">
                        <Clock className="w-3 h-3" />
                        <span className="capitalize">{formatDistanceToNow(fromUnixTime(vehicle.fecha), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5" title={`GSM Signal: ${vehicle.senal_gsm}`}>
                            <Wifi className="w-3 h-3" />
                            <span>{vehicle.senal_gsm}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title={`Vehicle Battery: ${vehicle.nivel_bateria_vehicular}V`}>
                            <Battery className="w-3 h-3" />
                            <span>{parseFloat(vehicle.nivel_bateria_vehicular).toFixed(1)}V</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
});
VehicleListItem.displayName = 'VehicleListItem';


export function VehicleList({ onVehicleSelect }: VehicleListProps) {
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const { selectedVehicle, visibleVehicleIds, trackedVehicleIds } = state;

    const handleSelect = useCallback((vehicle: Vehicle) => {
        dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        onVehicleSelect();
    }, [dispatch, onVehicleSelect]);

    const handleToggleVisibility = useCallback((id: number) => {
        dispatch({ type: 'TOGGLE_VEHICLE_VISIBILITY', payload: id });
    }, [dispatch]);

    const handleToggleTrack = useCallback((id: number) => {
        dispatch({ type: 'TOGGLE_TRACK_VEHICLE', payload: id });
    }, [dispatch]);

    const listVehicles = useMemo(() => {
        if (state.statusFilter.length === 0) {
            return state.vehicles;
        }
        return state.vehicles.filter(v => state.statusFilter.includes(String(v.id_estado)));
    }, [state.vehicles, state.statusFilter]);
    
    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-2">
                {listVehicles.map((vehicle, index) => (
                    <div key={vehicle.id_vehiculo} style={{ animationDelay: `${index * 30}ms` }}>
                        <VehicleListItem
                            vehicle={vehicle}
                            isSelected={selectedVehicle?.id_vehiculo === vehicle.id_vehiculo}
                            isVisible={visibleVehicleIds.has(vehicle.id_vehiculo)}
                            isTracked={trackedVehicleIds.includes(vehicle.id_vehiculo)}
                            onSelect={handleSelect}
                            onToggleVisibility={handleToggleVisibility}
                            onToggleTrack={handleToggleTrack}
                        />
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
