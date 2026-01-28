
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
    5: ParkingSquare, // Parked icon, not really used for the 'P'
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
            <div className="relative flex items-start justify-between w-full h-full">
                {groups.map((group, index) => {
                    const Icon = statusIconMap[group.id_estado] || Milestone;
                    const isSelected = selectedSegmentIndex === index;
                    const isLineHighlighted = isSelected || selectedSegmentIndex === index -1;

                    return (
                        <React.Fragment key={index}>
                            <div
                                ref={(el) => { if (el) { itemRefs.current[index] = el; } }}
                                className={cn(
                                    "flex flex-col items-center gap-2 text-center cursor-pointer w-40",
                                    index === 0 ? 'items-start text-left' : ''
                                )}
                                onClick={() => handleSegmentSelect(index)}
                            >
                               {group.id_estado === 5 ? (
                                    <div className={cn(
                                        "z-10 flex h-8 w-8 items-center justify-center rounded-full font-bold text-lg text-white transition-all",
                                        isSelected ? 'ring-4 ring-primary/50' : 'ring-0'
                                    )} style={{ backgroundColor: group.color }}>
                                        P
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "z-10 flex h-8 w-8 items-center justify-center rounded-full text-white transition-all",
                                        isSelected ? 'ring-4 ring-primary/50' : 'ring-0'
                                    )}
                                        style={{ backgroundColor: group.color }}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                )}


                                <div className={cn("text-center", index === 0 && 'w-full')}>
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
                            </div>

                            {index < groups.length - 1 && (
                                <div className={cn("relative flex-1 mt-4", isLineHighlighted ? 'text-primary' : 'text-muted-foreground')}>
                                     <div
                                        className={cn(
                                            "h-0.5 w-full",
                                            isLineHighlighted ? 'bg-primary' : 'bg-border'
                                        )}
                                    />
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-card text-center text-xs whitespace-nowrap">
                                        <div className="flex items-center gap-2">
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
                        </React.Fragment>
                    );
                })}
            </div>
        </CardContent>
    );
}
