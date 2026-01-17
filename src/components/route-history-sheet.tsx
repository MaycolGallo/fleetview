

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { RouteEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  PlayCircle,
  PauseCircle,
  Car,
  Flag,
  Clock,
  Milestone,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useMemo, useRef } from 'react';
import { useFleet, selectRouteSummary } from '@/context/fleet-context';


interface RouteHistorySheetProps {}

const statusIcons = {
  start: PlayCircle,
  driving: Truck,
  stop: PauseCircle,
  end: Flag,
  event: AlertTriangle,
};

function formatDuration(minutes: number) {
  if (minutes < 1) return '< 1 min';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  let result = '';
  if (h > 0) result += `${h}h `;
  if (m > 0) result += `${m}m`;
  return result.trim();
}

function RouteHistoryContent({ onSegmentSelect }: { onSegmentSelect: (index: number) => void}) {
    const { state } = useFleet();
    const { routeEvents: events, routeHistoryVehicle: vehicle, selectedSegmentIndex } = state;
    const { totalDistance, totalDuration, totalStops, totalStopTime } = useMemo(() => selectRouteSummary(state), [state.routeEvents]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, events.length);
    }, [events]);

    useEffect(() => {
        if (selectedSegmentIndex !== null && itemRefs.current[selectedSegmentIndex]) {
            itemRefs.current[selectedSegmentIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [selectedSegmentIndex]);

    return (
        <Card className="max-w-full mx-auto bg-card/90 backdrop-blur-sm border-primary/20 shadow-2xl h-full flex flex-col">
            <CardHeader>
              <CardTitle>Historial de Ruta: {vehicle?.placa}</CardTitle>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
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
                        <PauseCircle className="w-4 h-4 text-primary" />
                        <span>
                            {totalStops} stops{' '}
                            <strong className="text-foreground">
                                ({formatDuration(totalStopTime)})
                            </strong>
                        </span>
                    </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-4 flex-1">
              <ScrollArea className="w-full whitespace-nowrap h-full" viewportRef={scrollContainerRef}>
                <div className="relative flex items-stretch gap-0 px-4 pb-4 h-full">
                  {events.map((event, index) => {
                    const Icon = statusIcons[event.status];
                    const isSelected = selectedSegmentIndex === index;
                    const isClickable = event.status !== 'start' && event.status !== 'end';

                    return (
                      <div
                        key={index}
                        ref={el => itemRefs.current[index] = el}
                        className={cn(
                          "flex-shrink-0 group transition-all duration-300",
                           isSelected && isClickable ? 'scale-105' : 'scale-100'
                        )}
                        style={{ width: index === events.length -1 ? 'auto' : '180px'}}
                        onClick={isClickable ? () => onSegmentSelect(index) : undefined}
                      >
                        <div className={cn(
                          "relative flex flex-col items-center text-center h-full",
                          isClickable ? "cursor-pointer" : "cursor-default"
                        )}>
                          {/* Timeline line */}
                          {index < events.length - 1 && (
                             <div className={cn(
                                "absolute top-4 left-1/2 h-0.5 w-full bg-border transition-colors",
                                isSelected && isClickable ? 'bg-primary' : 'group-hover:bg-primary'
                            )} />
                          )}

                          <div className={cn(
                              "z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card ring-4 transition-all",
                              isSelected && isClickable ? 'ring-primary' : cn('ring-card', isClickable && 'group-hover:ring-primary')
                          )}>
                            <Icon className="h-5 w-5 text-primary" />
                          </div>

                          <div className="pt-2">
                             <p className={cn(
                                 "font-semibold capitalize text-sm transition-colors",
                                 isSelected && isClickable ? 'text-primary' : 'text-foreground'
                              )}>
                              {event.description}
                            </p>
                            <p className="text-xs text-muted-foreground whitespace-normal pt-1 px-1 h-10">
                              {/* Sub-description if any */}
                            </p>
                            <div className="mt-1 flex flex-col items-center gap-1 text-xs text-muted-foreground">
                              <span>
                                {format(parseISO(event.timestamp), 'p')}
                              </span>
                              {(event.durationMinutes > 0 || event.distanceKm > 0) && <Separator orientation="horizontal" className="w-10 my-1" />}
                              <div className="flex gap-2">
                              {event.durationMinutes > 0 && (
                                  <span>{formatDuration(event.durationMinutes)}</span>
                              )}
                              {event.distanceKm > 0 && (
                                <>
                                  {event.durationMinutes > 0 && <Separator orientation="vertical" className="h-3" />}
                                  <span>{event.distanceKm.toFixed(1)} km</span>
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

export function RouteHistorySheet(props: RouteHistorySheetProps) {
  const isMobile = useIsMobile();
  const { state, dispatch } = useFleet();
  const { isRouteSheetOpen } = state;

  const handleOpenChange = (isOpen: boolean) => {
    dispatch({ type: 'SET_ROUTE_SHEET_OPEN', payload: isOpen });
  }

  const handleSegmentSelect = (segmentIndex: number) => {
    dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: segmentIndex });
  };
  
  if (isMobile) {
    return (
        <Drawer open={isRouteSheetOpen} onOpenChange={handleOpenChange}>
            <DrawerContent className="h-[40%]">
                <RouteHistoryContent onSegmentSelect={handleSegmentSelect} />
            </DrawerContent>
      </Drawer>
    )
  }

  return (
    <AnimatePresence>
      {isRouteSheetOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-4 left-4 right-4 z-20"
        >
          <RouteHistoryContent onSegmentSelect={handleSegmentSelect} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
