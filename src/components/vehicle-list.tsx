
"use client";

import type { Vehicle } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import React, { useMemo, useCallback } from "react";
import { useFleetState, useFleetDispatch, statusDetailsMap, selectFilteredVehicles } from "@/context/fleet-context";
import { Button } from "./ui/button";
import { Car, MapPin, Route } from "lucide-react";
import { Badge } from "./ui/badge";

interface VehicleListProps {
    onVehicleSelect: () => void;
}

const VehicleListItem = React.memo(({
    vehicle,
    isSelected,
    onSelect,
    onShowRoute,
}: {
    vehicle: Vehicle;
    isSelected: boolean;
    onSelect: (vehicle: Vehicle) => void;
    onShowRoute: (e: React.MouseEvent, vehicle: Vehicle) => void;
}) => {
    const statusDetail = statusDetailsMap[vehicle.status];
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
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: statusDetail.color}}>
                        <Car className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold">{vehicle.placa}</p>
                        <p className="text-xs text-muted-foreground">{statusDetail.name}</p>
                    </div>
                </div>
                <Badge variant="outline" className="capitalize">{vehicle.velocidad} km/h</Badge>
            </div>
           
            <div className="flex justify-end gap-2 mt-3">
                <Button size="sm" variant="ghost" onClick={() => onSelect(vehicle)}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Locate
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => onShowRoute(e, vehicle)}>
                    <Route className="mr-2 h-4 w-4" />
                    History
                </Button>
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

    const handleShowRoute = useCallback((e: React.MouseEvent, vehicle: Vehicle) => {
        e.stopPropagation();
        // @ts-ignore
        if (document.startViewTransition) {
            // @ts-ignore
            document.startViewTransition(() => {
              dispatch({ type: 'START_ROUTE_LOADING', payload: vehicle });
            });
        } else {
            dispatch({ type: 'START_ROUTE_LOADING', payload: vehicle });
        }
    }, [dispatch]);

    const listVehicles = useMemo(() => selectFilteredVehicles(state), [state]);
    
    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-2">
                {listVehicles.map((vehicle) => (
                    <VehicleListItem
                        key={vehicle.id}
                        vehicle={vehicle}
                        isSelected={selectedVehicle?.id === vehicle.id}
                        onSelect={handleSelect}
                        onShowRoute={handleShowRoute}
                    />
                ))}
            </div>
        </ScrollArea>
    )
}
