
'use client';

import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { ClientOnly } from '@/components/client-only';
import { Skeleton } from '@/components/ui/skeleton';
import { VehicleDetails } from '@/components/vehicle/vehicle-details';
import { VehicleList } from '@/components/vehicle/vehicle-list';
import { VehicleFilters } from '@/components/vehicle/vehicle-filters';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LayoutPanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VehiclePanelContentProps {
    onVehicleSelect: () => void;
}

export function VehiclePanelContent({ onVehicleSelect }: VehiclePanelContentProps) {
    const { state, isLoadingVehicles } = useFleetState();
    const dispatch = useFleetDispatch();
    const { selectedVehicle, vehicles, visibleVehicleIds } = state;

    const allVisible = vehicles.length > 0 && vehicles.every(v => visibleVehicleIds.has(v.id_vehiculo));
    const someVisible = vehicles.some(v => visibleVehicleIds.has(v.id_vehiculo)) && !allVisible;

    const handleToggleAll = () => {
        const nextState = !allVisible;
        dispatch({ 
            type: 'SET_ALL_VEHICLES_VISIBILITY', 
            payload: { 
                ids: vehicles.map(v => v.id_vehiculo), 
                visible: nextState 
            } 
        });
    };

    return (
        <div className="h-full relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
                {selectedVehicle ? (
                    <motion.div 
                        key="details"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="h-full w-full"
                    >
                        <ClientOnly>
                            <VehicleDetails />
                        </ClientOnly>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="list"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="h-full flex flex-col"
                    >
                        <div className="p-4 border-b space-y-4 bg-muted/20">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <LayoutPanelLeft className="w-5 h-5 text-primary" />
                                    <div>
                                        <h2 className="text-lg font-bold leading-tight">Flota</h2>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                            {vehicles.length} Vehículos
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 bg-background/50 border px-2 py-1 rounded-lg shadow-sm hover:bg-background transition-colors">
                                    <Checkbox 
                                        id="toggle-all" 
                                        checked={allVisible} 
                                        onCheckedChange={handleToggleAll}
                                        className={cn(someVisible && "opacity-70")}
                                    />
                                    <Label htmlFor="toggle-all" className="text-xs font-bold cursor-pointer select-none">Todos</Label>
                                </div>
                            </div>
                            <div>
                                <VehicleFilters />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoadingVehicles ? (
                                <div className="p-4 flex flex-col gap-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <VehicleList onVehicleSelect={onVehicleSelect} />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
