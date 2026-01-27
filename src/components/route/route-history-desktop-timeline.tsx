'use client';

import { CardContent } from '@/components/ui/card';
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { ScrollBar } from '@/components/ui/scroll-area';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { cn } from '@/lib/utils';
import { Milestone, Clock, ParkingSquare, Truck } from 'lucide-react';
import { format, fromUnixTime } from 'date-fns';
import React from 'react';

interface RouteHistoryDesktopTimelineProps {
    itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const statusIconMap: { [key: number]: React.ElementType } = {
    4: Clock, // Ralenti
    5: ParkingSquare, // Estacionado
    6: Truck, // Transitando
};

export function RouteHistoryDesktopTimeline({
    itemRefs,
    scrollContainerRef,
}: RouteHistoryDesktopTimelineProps) {
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const { routeGroups: groups, selectedSegmentIndex } = state;

    const handleSegmentSelect = (index: number) => {
        dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: index });
    };

    return (
        <CardContent className="pb-0 flex-1 min-h-0">
            <ScrollAreaPrimitive.Root className="w-full h-full relative">
                <ScrollAreaPrimitive.Viewport
                    ref={scrollContainerRef}
                    className="h-full w-full rounded-[inherit] py-2"
                >
                    <div className="relative flex items-start justify-start gap-0 px-4 h-full py-4">
                        {groups.map((group, index) => {
                            const Icon = statusIconMap[group.id_estado] || Milestone;
                            const isSelected = selectedSegmentIndex === index;
                            const isNextSelected = selectedSegmentIndex === index + 1;

                            return (
                                <div
                                    key={index}
                                    ref={(el) => { if(el) { itemRefs.current[index] = el; } }}
                                    className={cn(
                                        "flex-shrink-0 group transition-all duration-300 cursor-pointer",
                                        isSelected ? 'scale-105' : 'scale-100'
                                    )}
                                    style={{ width: '200px' }}
                                    onClick={() => handleSegmentSelect(index)}
                                >
                                    <div className="relative flex flex-col items-center text-center justify-start">
                                        
                                        {index < groups.length - 1 && (
                                            <>
                                                <div className={cn(
                                                    "absolute top-4 left-1/2 h-0.5 w-full transition-colors",
                                                    (isSelected || isNextSelected) ? 'bg-primary' : 'bg-border group-hover:bg-primary'
                                                )} />

                                                <div className="absolute top-4 left-full -translate-x-1/2 -translate-y-1/2 z-20">
                                                    <div className="bg-card text-foreground text-[10px] font-semibold px-2 py-1 rounded-md shadow-sm whitespace-nowrap flex items-center gap-3">
                                                        {group.total_time_seconds > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                <span>{group.total_time_formatted}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <Milestone className="w-2.5 h-2.5" />
                                                            <span>{group.total_distance_km.toFixed(1)} km</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        
                                        <div className={cn(
                                            "z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card ring-4 transition-all",
                                            isSelected ? 'ring-primary' : 'ring-card',
                                            'group-hover:ring-primary'
                                        )}>
                                            <Icon className="h-5 w-5" style={{ color: group.color }} />
                                        </div>

                                        <div className="pt-2">
                                            <p className={cn(
                                                "font-semibold capitalize text-sm transition-colors",
                                                isSelected ? 'text-primary' : 'text-foreground'
                                            )}>
                                                {group.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground whitespace-normal min-h-[2.5rem]">
                                                {format(fromUnixTime(group.records[0].fecha), 'p')} - {format(fromUnixTime(group.records[group.records.length - 1].fecha), 'p')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollAreaPrimitive.Viewport>
                <ScrollBar orientation="horizontal" />
                <ScrollAreaPrimitive.Corner />
            </ScrollAreaPrimitive.Root>
        </CardContent>
    )
}
