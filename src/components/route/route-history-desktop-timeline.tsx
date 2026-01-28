'use client';

import { CardContent } from '@/components/ui/card';
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
}: RouteHistoryDesktopTimelineProps) {
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const { routeGroups: groups, selectedSegmentIndex } = state;

    const handleSegmentSelect = (index: number) => {
        dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: index });
    };

    if (!groups || groups.length === 0) {
        return <CardContent className="pb-6 pt-4 flex-1 min-h-[120px]" />;
    }

    return (
        <CardContent className="pb-6 pt-4 flex-1 min-h-0">
            <div className="relative flex w-full">
                {groups.map((group, index) => {
                    const Icon = statusIconMap[group.id_estado] || Milestone;
                    const isSelected = selectedSegmentIndex === index;
                    // A line is highlighted if it's connected to a selected segment.
                    const isLineHighlighted = isSelected || selectedSegmentIndex === index - 1;

                    return (
                        <div
                            key={index}
                            ref={(el) => { if (el) { itemRefs.current[index] = el; } }}
                            className={cn(
                                "relative flex flex-col items-center gap-2 pt-4 flex-1 cursor-pointer"
                            )}
                            onClick={() => handleSegmentSelect(index)}
                        >
                            {/* Icon */}
                            <div
                                className={cn(
                                    "z-10 flex h-8 w-8 items-center justify-center rounded-full font-bold text-lg text-white transition-all",
                                    isSelected ? 'ring-4 ring-primary/50' : 'ring-0'
                                )}
                                style={{ backgroundColor: group.id_estado === 5 ? '#666666' : group.color }}
                            >
                               {group.id_estado === 5 ? (
                                    'P'
                                ) : (
                                    <Icon className="h-5 w-5" />
                                )}
                            </div>

                            {/* Text */}
                            <div className={cn("text-center")}>
                                <p className={cn(
                                    "font-semibold capitalize text-sm",
                                    isSelected ? 'text-primary' : 'text-foreground'
                                )}>
                                    {group.description}
                                </p>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(fromUnixTime(group.records[0].fecha), 'p')} - {format(fromUnixTime(group.records[group.records.length - 1].fecha), 'p')}
                                </p>
                            </div>

                            {/* Line to next item */}
                            {index < groups.length - 1 && (
                                <div className="absolute top-8 left-1/2 w-full h-0.5 z-0">
                                    <div className={cn("h-full", isLineHighlighted ? 'bg-primary' : 'bg-border')} />
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-card text-center text-xs whitespace-nowrap">
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
        </CardContent>
    );
}
