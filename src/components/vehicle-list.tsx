
"use client";

import type { Vehicle } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useFleet, statusDetailsMap, selectFilteredVehicles } from "@/context/fleet-context";
import { Button } from "./ui/button";
import { BarChart, Car, MapPin, Route } from "lucide-react";
import { Badge } from "./ui/badge";

interface VehicleListProps {
    onVehicleSelect: () => void;
}

export function VehicleList({ onVehicleSelect }: VehicleListProps) {
    const { state, dispatch } = useFleet();
    const { selectedVehicle } = state;

    const handleSelect = (vehicle: Vehicle) => {
        dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        onVehicleSelect();
    };

    const handleShowRoute = (e: React.MouseEvent, vehicle: Vehicle) => {
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
    }

    const listVehicles = useMemo(() => selectFilteredVehicles(state), [state.vehicles, state.statusFilter, state.visibleVehicleIds]);
    
    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-2">
                {listVehicles.map((vehicle) => {
                    const statusDetail = statusDetailsMap[vehicle.status];
                    return (
                        <div
                            key={vehicle.id}
                            className={cn(
                                "p-3 rounded-lg border text-left transition-colors",
                                selectedVehicle?.id === vehicle.id ? "bg-accent border-primary" : "bg-card hover:bg-accent"
                            )}
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
                                <Button size="sm" variant="ghost" onClick={() => handleSelect(vehicle)}>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Locate
                                </Button>
                                <Button size="sm" variant="ghost" onClick={(e) => handleShowRoute(e, vehicle)}>
                                    <Route className="mr-2 h-4 w-4" />
                                    History
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    )
}
