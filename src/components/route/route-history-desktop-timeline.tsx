
'use client';

import { CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Milestone } from 'lucide-react';
import { format, fromUnixTime } from 'date-fns';
import React from 'react';
import type { VehiculoHistorialGrouped } from '@/lib/types';

interface RouteHistoryDesktopTimelineProps {
    groups: VehiculoHistorialGrouped[];
    statusIconMap: { [key: number]: React.ElementType };
    selectedSegmentIndex: number | null;
    onSegmentSelect: (index: number) => void;
    itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export function RouteHistoryDesktopTimeline({
    groups,
    statusIconMap,
    selectedSegmentIndex,
    onSegmentSelect,
    itemRefs,
    scrollContainerRef,
}: RouteHistoryDesktopTimelineProps) {
    return (
        <CardContent className="pb-4 flex-1 min-h-0">
            <ScrollArea className="w-full whitespace-nowrap h-full" viewportRef={scrollContainerRef}>
            <div className="relative flex items-stretch gap-0 px-4 pb-4 h-full">
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
                    style={{ width: '200px'}}
                    onClick={() => onSegmentSelect(index)}
                    >
                    <div className="relative flex flex-col items-center text-center h-full">
                        {index < groups.length - 1 && (
                            <div className={cn(
                            "absolute top-4 left-1/2 h-0.5 w-full transition-colors",
                            isSelected ? 'bg-primary' : 'bg-border group-hover:bg-primary'
                        )} />
                        )}

                        <div className={cn(
                            "z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card ring-4 transition-all",
                            isSelected ? 'ring-primary' : 'ring-card',
                            'group-hover:ring-primary'
                        )}>
                        <Icon className="h-5 w-5" style={{color: group.color}} />
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
            <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </CardContent>
    )
}
