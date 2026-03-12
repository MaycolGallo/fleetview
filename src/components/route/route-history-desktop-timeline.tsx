
'use client';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { cn } from '@/lib/utils';
import { Milestone, Clock, Truck, ParkingSquare } from 'lucide-react';
import { format, fromUnixTime } from 'date-fns';
import React from 'react';

interface RouteHistoryDesktopTimelineProps {
    itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const statusIconMap: { [key: number]: React.ElementType } = {
    4: Clock, // Ralenti
    6: Truck, // Transitando
    5: ParkingSquare, // Parked icon
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

    if (!groups || groups.length === 0) {
        return <div className="h-[140px]" />;
    }

    return (
        <ScrollArea className="w-full" viewportRef={scrollContainerRef}>
            <div className="flex items-start p-4 pt-6 min-w-max">
                {groups.map((group, index) => {
                    const Icon = statusIconMap[group.id_estado] || Milestone;
                    const isSelected = selectedSegmentIndex === index;
                    const isLineHighlighted = isSelected || (selectedSegmentIndex !== null && selectedSegmentIndex > index);

                    return (
                        <div
                            key={index}
                            ref={(el) => { if (el) { itemRefs.current[index] = el; } }}
                            className={cn(
                                "relative flex flex-col items-center gap-3 w-[240px] cursor-pointer group transition-all",
                                isSelected ? "scale-105" : "hover:scale-102"
                            )}
                            onClick={() => handleSegmentSelect(index)}
                        >
                            {/* Icon Circle */}
                            <div
                                className={cn(
                                    "z-10 flex h-10 w-10 items-center justify-center rounded-full font-bold text-lg text-white transition-all shadow-md",
                                    isSelected ? 'ring-4 ring-primary' : 'ring-2 ring-border group-hover:ring-primary/50'
                                )}
                                style={{ backgroundColor: group.id_estado === 5 ? '#666666' : group.color }}
                            >
                               {group.id_estado === 5 ? (
                                    'P'
                                ) : (
                                    <Icon className="h-6 w-6" />
                                )}
                            </div>

                            {/* Info Box */}
                            <div className={cn(
                                "text-center p-2 rounded-lg transition-colors w-full px-4",
                                isSelected ? "bg-primary/5 border border-primary/20" : "group-hover:bg-accent/50"
                            )}>
                                <p className={cn(
                                    "font-bold capitalize text-sm",
                                    isSelected ? 'text-primary' : 'text-foreground'
                                )}>
                                    {group.description}
                                </p>
                                <p className="text-xs text-muted-foreground whitespace-nowrap font-medium mt-1">
                                    {format(fromUnixTime(group.records[0].fecha), 'HH:mm')} - {format(fromUnixTime(group.records[group.records.length - 1].fecha), 'HH:mm')}
                                </p>
                                {group.address_short && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px] mx-auto opacity-70" title={group.address}>
                                        {group.address_short}
                                    </p>
                                )}
                            </div>

                            {/* Connecting Line */}
                            {index < groups.length - 1 && (
                                <div className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-1 z-0">
                                    <div className={cn("h-full rounded-full transition-colors", isLineHighlighted ? 'bg-primary' : 'bg-border')} />
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-card border rounded-full text-center text-[10px] font-bold shadow-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Milestone className="w-3 h-3" />
                                                <span>{group.total_distance_km.toFixed(2)}km</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{group.total_time_formatted}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
