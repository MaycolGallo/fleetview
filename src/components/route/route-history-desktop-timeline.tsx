
'use client';

import { CardContent } from '@/components/ui/card';
import { ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { cn } from '@/lib/utils';
import { Milestone, Clock, ParkingSquare, Truck } from 'lucide-react';
import { format, fromUnixTime } from 'date-fns';
import React from 'react';
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

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
        <CardContent className="pb-4 flex-1 min-h-0">
            <ScrollAreaPrimitive.Root className="w-full whitespace-nowrap h-full relative overflow-hidden">
                <ScrollAreaPrimitive.Viewport
                    ref={scrollContainerRef}
                    className="h-full w-full rounded-[inherit]"
                >
                    <div className="relative flex items-stretch gap-0 px-4 h-full py-2">
                        {groups.map((group, index) => {
                            const Icon = statusIconMap[group.id_estado] || Milestone;
                            const isSelected = selectedSegmentIndex === index;

                            return (
                                <div
                                    key={index}
                                    ref={(el) => { itemRefs.current[index] = el; }}
                                    className={cn(
                                        "flex-shrink-0 group transition-all duration-300 cursor-pointer",
                                        isSelected ? 'scale-105' : 'scale-100'
                                    )}
                                    style={{ width: '200px' }}
                                    onClick={() => handleSegmentSelect(index)}
                                >
                                    <div className="relative flex flex-col items-center justify-center text-center h-full">
                                        {index < groups.length - 1 && (
                                            <div className={cn(
                                                "absolute top-1/2 -translate-y-1/2 left-1/2 h-0.5 w-full transition-colors",
                                                isSelected ? 'bg-primary' : 'bg-border group-hover:bg-primary'
                                            )} />
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
                                            <p className="text-xs text-muted-foreground whitespace-normal pt-1 px-1 h-10">
                                                {format(fromUnixTime(group.records[0].fecha), 'p')} - {format(fromUnixTime(group.records[group.records.length - 1].fecha), 'p')}
                                            </p>
                                            <div className="mt-1 flex flex-col items-center gap-1 text-xs text-muted-foreground">
                                                {(group.total_time_seconds > 0 || group.total_distance_km > 0) && <Separator orientation="horizontal" className="w-10 my-1" />}
                                                <div className="flex gap-2">
                                                    {group.total_time_seconds > 0 && (
                                                        <span>{group.total_time_formatted}</span>
                                                    )}
                                                    {group.total_distance_km > 0 && (
                                                        <>
                                                            {group.total_time_seconds > 0 && <Separator orientation="vertical" className="h-3" />}
                                                            <span>{group.total_distance_km.toFixed(1)} km</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
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
