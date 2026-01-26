
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ParkingSquare,
  Clock,
  Milestone,
  Play,
  Pause,
  Truck,
} from 'lucide-react';
import { format, fromUnixTime } from 'date-fns';
import React, { useEffect, useMemo, useRef } from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { DrawerHeader, DrawerTitle, DrawerDescription } from './ui/drawer';
import { selectRouteSummary } from '@/context/fleet-context';

interface RouteHistoryContentProps {
    onSegmentSelect: (index: number) => void;
}

const statusIconMap: { [key: number]: React.ElementType } = {
    4: Clock, // Ralenti
    5: ParkingSquare, // Estacionado
    6: Truck, // Transitando
};


function formatDuration(minutes: number) {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds}s`;
  }
  
  const totalMinutes = Math.round(minutes);
  if (totalMinutes < 60) {
      return `${totalMinutes}m`;
  }

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  
  let result = `${h}h`;
  if (m > 0) {
    result += ` ${m}m`;
  }
  return result;
}

export function RouteHistoryContent({ onSegmentSelect }: RouteHistoryContentProps) {
    const isMobile = useIsMobile();
    const { state } = useFleetState();
    const { routeGroups: groups, selectedSegmentIndex } = state;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, groups.length);
    }, [groups]);

    useEffect(() => {
        if (selectedSegmentIndex !== null && itemRefs.current[selectedSegmentIndex]) {
            itemRefs.current[selectedSegmentIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: isMobile ? undefined : 'center'
            });
        }
    }, [selectedSegmentIndex, isMobile]);

    if (isMobile) {
        return (
            <ScrollArea className="h-full" viewportRef={scrollContainerRef}>
                <div className="relative flex flex-col p-4 pt-2">
                {groups.map((group, index) => {
                    const Icon = statusIconMap[group.id_estado] || Milestone;
                    const isSelected = selectedSegmentIndex === index;

                    return (
                        <div
                            key={index}
                            ref={el => itemRefs.current[index] = el}
                            className="flex group"
                            onClick={() => onSegmentSelect(index)}
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
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground text-right ml-2">
                                            {group.total_time_seconds > 0 && (
                                                <span className='whitespace-nowrap'>{group.total_time_formatted}</span>
                                            )}
                                            {group.total_distance_km > 0 && (
                                                <span className='whitespace-nowrap'>{group.total_distance_km.toFixed(1)} km</span>
                                            )}
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
    
    // Desktop layout
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
                    ref={el => itemRefs.current[index] = el}
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
