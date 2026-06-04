"use client";

import type { Vehicle } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import React, { useMemo, useCallback } from "react";
import { useFleetState, useFleetDispatch } from "@/context/fleet-context";
import { Car, Clock, Wifi, Battery, Radar, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fromUnixTime, formatDistanceToNow } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface VehicleListProps {
    onVehicleSelect: () => void;
}

const VehicleListItem = React.memo(({
    vehicle,
    isSelected,
    isVisible,
    onSelect,
    onToggleVisibility,
}: {
    vehicle: Vehicle;
    isSelected: boolean;
    isVisible: boolean;
    onSelect: (vehicle: Vehicle) => void;
    onToggleVisibility: (id: number) => void;
}) => {
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const { miniMaps } = state;

    const vehicleInMaps = miniMaps.filter(m => m.vehicleIds.includes(vehicle.id_vehiculo));
    const isTracked = vehicleInMaps.length > 0;

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
                
                <Popover>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <Button 
                                variant={isTracked ? "default" : "ghost"} 
                                size="icon" 
                                className="h-8 w-8 rounded-full"
                            >
                                <Radar className={cn("h-4 w-4", isTracked && "animate-pulse")} />
                            </Button>
                          </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                          Asignar a Mini-map
                      </TooltipContent>
                  </Tooltip>
                  <PopoverContent className="w-56 p-2" side="right">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground px-2 pb-1">Radar Lock / Groups</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start text-xs h-8"
                          onClick={() => dispatch({ type: 'CREATE_MINIMAP', payload: { vehicleId: vehicle.id_vehiculo } })}
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          Nuevo Mini-map
                        </Button>
                        {miniMaps.map(map => {
                           const isInThisMap = map.vehicleIds.includes(vehicle.id_vehiculo);
                           return (
                             <Button 
                                key={map.id}
                                variant={isInThisMap ? "secondary" : "ghost"}
                                size="sm" 
                                className="w-full justify-start text-xs h-8"
                                onClick={() => {
                                  if (isInThisMap) {
                                    dispatch({ type: 'REMOVE_VEHICLE_FROM_MINIMAP', payload: { miniMapId: map.id, vehicleId: vehicle.id_vehiculo } });
                                  } else {
                                    dispatch({ type: 'ADD_VEHICLE_TO_MINIMAP', payload: { miniMapId: map.id, vehicleId: vehicle.id_vehiculo } });
                                  }
                                }}
                              >
                                <Radar className={cn("w-3 h-3 mr-2", isInThisMap && "text-primary")} />
                                <span className="truncate flex-1 text-left">{map.name}</span>
                                {isInThisMap && <X className="w-3 h-3 ml-2 opacity-50" />}
                             </Button>
                           )
                        })}
                     </div>
                  </PopoverContent>
                </Popover>
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
                    <Badge variant="outline" className="capitalize shrink-0 bg-background/50 font-mono">{parseFloat(vehicle.velocidad).toFixed(0)} km/h</Badge>
                </div>
               
                <div className="flex justify-between items-center mt-3 pt-3 border-t text-[10px] text-muted-foreground">
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
    const { selectedVehicle, visibleVehicleIds } = state;

    const handleSelect = useCallback((vehicle: Vehicle) => {
        dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        onVehicleSelect();
    }, [dispatch, onVehicleSelect]);

    const handleToggleVisibility = useCallback((id: number) => {
        dispatch({ type: 'TOGGLE_VEHICLE_VISIBILITY', payload: id });
    }, [dispatch]);

    const listVehicles = useMemo(() => {
        // Keep radar-grouped vehicles in the fleet list as well.
        // The panel should show all vehicles filtered only by status, not by radar membership.
        if (state.statusFilter.length === 0) {
            return state.vehicles;
        }
        return state.vehicles.filter(v => state.statusFilter.includes(String(v.id_estado)));
    }, [state.vehicles, state.statusFilter]);
    
    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-3">
                {listVehicles.map((vehicle, index) => (
                    <div key={vehicle.id_vehiculo} style={{ animationDelay: `${index * 30}ms` }}>
                        <VehicleListItem
                            vehicle={vehicle}
                            isSelected={selectedVehicle?.id_vehiculo === vehicle.id_vehiculo}
                            isVisible={visibleVehicleIds.has(vehicle.id_vehiculo)}
                            onSelect={handleSelect}
                            onToggleVisibility={handleToggleVisibility}
                        />
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
