
"use client";

import type { Vehicle } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import React, { useMemo, useCallback } from "react";
import { useFleetState, useFleetDispatch, selectFilteredVehicles } from "@/context/fleet-context";
import { Car, Clock, Wifi, Battery } from "lucide-react";
import { Badge } from "./ui/badge";
import { fromUnixTime, formatDistanceToNow } from 'date-fns';

interface VehicleListProps {
    onVehicleSelect: () => void;
}

const VehicleListItem = React.memo(({
    vehicle,
    isSelected,
    onSelect,
}: {
    vehicle: Vehicle;
    isSelected: boolean;
    onSelect: (vehicle: Vehicle) => void;
}) => {
    return (
        <div
            className={cn(
                "p-3 rounded-lg border text-left transition-colors cursor-pointer",
                isSelected ? "bg-accent border-primary" : "bg-card hover:bg-accent"
            )}
            onClick={() => onSelect(vehicle)}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: vehicle.estado.param3}}>
                        <Car className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold">{vehicle.vehiculo.vehiculo_placa}</p>
                        <p className="text-xs text-muted-foreground">{vehicle.estado.param1}</p>
                    </div>
                </div>
                <Badge variant="outline" className="capitalize">{parseFloat(vehicle.velocidad).toFixed(0)} km/h</Badge>
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
    )
});
VehicleListItem.displayName = 'VehicleListItem';


export function VehicleList({ onVehicleSelect }: VehicleListProps) {
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const { selectedVehicle } = state;

    const handleSelect = useCallback((vehicle: Vehicle) => {
        dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        onVehicleSelect();
    }, [dispatch, onVehicleSelect]);

    const listVehicles = useMemo(() => selectFilteredVehicles(state), [state]);
    
    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-2">
                {listVehicles.map((vehicle) => (
                    <VehicleListItem
                        key={vehicle.id_vehiculo}
                        vehicle={vehicle}
                        isSelected={selectedVehicle?.id_vehiculo === vehicle.id_vehiculo}
                        onSelect={handleSelect}
                    />
                ))}
            </div>
        </ScrollArea>
    )
}
