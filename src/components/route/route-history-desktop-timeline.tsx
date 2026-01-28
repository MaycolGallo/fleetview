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
                                className="flex flex-col items-center gap-2 text-center cursor-pointer w-40"
                                onClick={() => handleSegmentSelect(index)}
                            >
                               {group.id_estado === 5 ? (
                                    <div className={cn(
                                        "z-10 flex h-8 w-8 items-center justify-center rounded-full font-bold text-lg transition-all",
                                        isSelected ? 'ring-4 ring-primary/50' : 'ring-0',
                                        'bg-white text-gray-600 border-2 border-gray-400'
                                    )}>
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


                                <div className="text-center">
                                    <p className={cn(
                                        "font-semibold capitalize text-sm",
                                        isSelected ? 'text-primary' : 'text-foreground'
                                    )}>
                                        {group.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                        {format(fromUnixTime(group.records[0].fecha), 'p')} - {format(fromUnixTime(group.records[group.records.length - 1].fecha), 'p')}
                                        {index === groups.length - 1 && <span className='font-semibold'> - Current</span>}
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
                                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full text-center text-xs whitespace-nowrap">
                                        <span>{group.total_distance_km.toFixed(2)}km</span>
                                        <span className='mx-1'>-</span>
                                        <span>{group.total_time_formatted}</span>
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
