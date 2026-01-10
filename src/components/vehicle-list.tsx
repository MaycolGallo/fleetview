

"use client";

import type { Vehicle } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useFleet, statusDetailsMap } from "@/context/fleet-context";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { Car, User, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface VehicleListProps {
    onVehicleSelect: () => void;
}

export function VehicleList({ onVehicleSelect }: VehicleListProps) {
    const { state, dispatch } = useFleet();
    const { vehicles, statusFilter, selectedVehicle } = state;

    const handleSelect = (vehicle: Vehicle) => {
        dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        onVehicleSelect();
    };

    const listVehicles = useMemo(() => {
        if (statusFilter === 'all') {
            return vehicles;
        }
        return vehicles.filter(v => v.status === statusFilter);
    }, [vehicles, statusFilter]);
    
    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-2">
                {listVehicles.map((vehicle, index) => {
                    const statusDetail = statusDetailsMap[vehicle.status];
                    const image = PlaceHolderImages[index % PlaceHolderImages.length];

                    const isDriving = vehicle.status === '6';
                    const isStopped = ['1', '5'].includes(vehicle.status);
                    
                    return (
                        <div
                            key={vehicle.id}
                            className={cn(
                                "flex items-start gap-4 p-3 rounded-lg border text-left transition-colors text-sm cursor-pointer",
                                selectedVehicle?.id === vehicle.id ? "bg-accent border-primary" : "bg-card hover:bg-accent"
                            )}
                            onClick={() => handleSelect(vehicle)}
                        >
                            <Image 
                                src={image.imageUrl} 
                                alt={vehicle.placa} 
                                width={96} 
                                height={64} 
                                className="w-24 h-16 object-cover rounded-md"
                                data-ai-hint={image.imageHint}
                            />
                            <div className="flex-1 truncate">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold truncate">{vehicle.placa}</p>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusDetail.color }}></div>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1 mt-1">
                                    <div className="flex items-center gap-2">
                                        <Car className="w-3 h-3" />
                                        <span>Nissan Frontier 2015</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="w-3 h-3" />
                                        <span>Jenny Wilson</span>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    {isDriving ? (
                                        <div className="inline-flex items-center gap-2 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span>{vehicle.velocidad} km/h</span>
                                        </div>
                                    ) : isStopped ? (
                                        <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                            <Clock className="w-3 h-3" />
                                            <span>3 min ago</span>
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-2 text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>{vehicle.nombre_estado}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    )
}
