'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { RouteSegment } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  ParkingSquare,
  Clock,
  Milestone,
  Play,
  Pause,
} from 'lucide-react';
import { format, fromUnixTime } from 'date-fns';
import React, { useEffect, useMemo, useRef } from 'react';
import { useFleetState, useFleetDispatch, selectRouteSummary, routeStatusDetailsMap } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface RouteHistoryContentProps {
    onSegmentSelect: (index: number) => void;
}

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
    const dispatch = useFleetDispatch();
    const { routeSegments: segments, historyVehicle: vehicle, selectedSegmentIndex, isRoutePlaying } = state;
    const { totalDistance, totalDuration, totalStops, totalStopTime } = useMemo(() => selectRouteSummary(state), [state]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, segments.length);
    }, [segments]);

    useEffect(() => {
        if (selectedSegmentIndex !== null && itemRefs.current[selectedSegmentIndex]) {
            itemRefs.current[selectedSegmentIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: isMobile ? undefined : 'center'
            });
        }
    }, [selectedSegmentIndex, isMobile]);

    const handlePlayPause = () => {
        if (isRoutePlaying) {
            dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
        } else {
            dispatch({ type: 'START_ROUTE_PLAYBACK' });
        }
    };

    if (isMobile) {
        return (
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full" viewportRef={scrollContainerRef}>
                    <div className="relative flex flex-col p-4 pt-2">
                    {segments.map((segment, index) => {
                        const statusInfo = routeStatusDetailsMap[segment.id_estado] || { icon: Milestone, name: 'Event', color: '#888' };
                        const Icon = statusInfo.icon;
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
                                        <Icon className="h-5 w-5" style={{color: statusInfo.color}} />
                                    </div>
                                    {index < segments.length - 1 && (
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
                                                    {segment.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground pt-1">
                                                    {format(fromUnixTime(segment.startTime), 'p')} - {format(fromUnixTime(segment.endTime), 'p')}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground text-right ml-2">
                                                {segment.durationMinutes > 0 && (
                                                    <span className='whitespace-nowrap'>{formatDuration(segment.durationMinutes)}</span>
                                                )}
                                                {segment.distanceKm > 0 && (
                                                    <span className='whitespace-nowrap'>{segment.distanceKm.toFixed(1)} km</span>
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
            </div>
        );
    }
    
    // Desktop layout
    const headerContent = (
      <div className="flex justify-between items-start gap-4">
        <div>
          <CardTitle>Route History: {vehicle?.placa}</CardTitle>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
              <Milestone className="w-4 h-4 text-primary" />
              <span>
                Total Distance:{' '}
                <strong className="text-foreground">
                  {totalDistance.toFixed(1)} km
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>
                Total Time:{' '}
                <strong className="text-foreground">
                  {formatDuration(totalDuration)}
                </strong>
              </span>
            </div>
            {totalStops > 0 && (
                <div className="flex items-center gap-2">
                    <ParkingSquare className="w-4 h-4 text-primary" />
                    <span>
                        {totalStops} stops{' '}
                        <strong className="text-foreground">
                            ({formatDuration(totalStopTime)})
                        </strong>
                    </span>
                </div>
            )}
          </div>
        </div>
        <Button size="icon" onClick={handlePlayPause} className="flex-shrink-0">
            {isRoutePlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span className="sr-only">{isRoutePlaying ? 'Pause' : 'Play'}</span>
        </Button>
      </div>
    );

    return (
        <Card className="max-w-full mx-auto bg-card/90 backdrop-blur-sm border-primary/20 shadow-2xl h-full flex flex-col">
            <CardHeader>{headerContent}</CardHeader>
            <CardContent className="pb-4 flex-1 min-h-0">
              <ScrollArea className="w-full whitespace-nowrap h-full" viewportRef={scrollContainerRef}>
                <div className="relative flex items-stretch gap-0 px-4 pb-4 h-full">
                  {segments.map((segment, index) => {
                    const statusInfo = routeStatusDetailsMap[segment.id_estado] || { icon: Milestone, name: 'Event', color: '#888' };
                    const Icon = statusInfo.icon;
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
                          {index < segments.length - 1 && (
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
                            <Icon className="h-5 w-5" style={{color: statusInfo.color}} />
                          </div>

                          <div className="pt-2">
                             <p className={cn(
                                 "font-semibold capitalize text-sm transition-colors",
                                 isSelected ? 'text-primary' : 'text-foreground'
                              )}>
                              {segment.description}
                            </p>
                            <p className="text-xs text-muted-foreground whitespace-normal pt-1 px-1 h-10">
                                {format(fromUnixTime(segment.startTime), 'p')} - {format(fromUnixTime(segment.endTime), 'p')}
                            </p>
                            <div className="mt-1 flex flex-col items-center gap-1 text-xs text-muted-foreground">
                              {(segment.durationMinutes > 0 || segment.distanceKm > 0) && <Separator orientation="horizontal" className="w-10 my-1" />}
                              <div className="flex gap-2">
                              {segment.durationMinutes > 0 && (
                                  <span>{formatDuration(segment.durationMinutes)}</span>
                              )}
                              {segment.distanceKm > 0 && (
                                <>
                                  {segment.durationMinutes > 0 && <Separator orientation="vertical" className="h-3" />}
                                  <span>{segment.distanceKm.toFixed(1)} km</span>
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
          </Card>
    )
}
