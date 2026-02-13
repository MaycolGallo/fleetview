
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { cn } from '@/lib/utils';
import { Milestone, Clock, ParkingSquare, Truck } from 'lucide-react';
import { format, fromUnixTime } from 'date-fns';
import React from 'react';
import type { VehiculoHistorialGrouped } from '@/lib/types';

interface RouteHistoryMobileTimelineProps {
    itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const statusIconMap: { [key: number]: React.ElementType } = {
    4: Clock, // Ralenti
    5: ParkingSquare, // Estacionado
    6: Truck, // Transitando
};

export function RouteHistoryMobileTimeline({
    itemRefs,
    scrollContainerRef,
}: RouteHistoryMobileTimelineProps) {
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const { routeGroups: groups, selectedSegmentIndex } = state;

    const handleSegmentSelect = (index: number) => {
        dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: index });
    };

    return (
        <ScrollArea className="h-full" viewportRef={scrollContainerRef}>
            <div className="relative flex flex-col p-4 pt-2">
            {groups.map((group, index) => {
                const Icon = statusIconMap[group.id_estado] || Milestone;
                const isSelected = selectedSegmentIndex === index;

                return (
                    <div
                        key={index}
                        ref={(el) => { if(el) { itemRefs.current[index] = el; } }}
                        className="flex group"
                        onClick={() => handleSegmentSelect(index)}
                    >
                        <div className="flex flex-col items-center mr-4">
                            <div className={cn(
                                "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background ring-4 transition-all",
                                isSelected ? 'ring-primary' : 'ring-border', 'group-hover:ring-primary'
                            )}>
                                <Icon className="h-5 w-5" style={{color: group.color}} />
                            </div>
                            {index < groups.length - 1 && (
                                <div className={cn("w-0.5 flex-1 transition-colors", isSelected ? 'bg-primary' : 'bg-border group-hover:bg-primary')} />
                            )}
                        </div>
                        <div className={cn(
                            "flex-1 pb-6 transition-transform duration-300 cursor-pointer",
                            isSelected ? 'transform scale-105' : 'scale-100'
                        )}>
                            <div className={cn(
                                "p-3 rounded-lg border -translate-y-1",
                                isSelected ? "bg-accent border-primary" : "bg-card hover:bg-accent"
                            )}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className={cn(
                                            "font-semibold capitalize text-sm transition-colors",
                                            isSelected ? 'text-primary' : 'text-foreground'
                                        )}>
                                            {group.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground pt-1">
                                            {format(fromUnixTime(group.records[0].fecha), 'p')} - {format(fromUnixTime(group.records[group.records.length - 1].fecha), 'p')}
                                        </p>
                                        {group.address_short && (
                                            <p className="text-xs text-muted-foreground pt-1 truncate" title={group.address}>
                                                {group.address_short}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground text-right ml-2">
                                        {group.total_time_seconds > 0 && (
                                             <div className="flex items-center gap-1.5">
                                                <span className='whitespace-nowrap'>{group.total_time_formatted}</span>
                                                <Clock className="w-3 h-3" />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <span className='whitespace-nowrap'>{group.total_distance_km.toFixed(1)} km</span>
                                            <Milestone className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            </div>
        </ScrollArea>
    );
}
