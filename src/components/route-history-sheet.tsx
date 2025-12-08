
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { RouteEvent, Vehicle } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  PlayCircle,
  PauseCircle,
  Car,
  Flag,
  Clock,
  Milestone,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef } from 'react';


interface RouteHistorySheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  events: RouteEvent[];
  vehicle: Vehicle | null;
  onSegmentSelect: (segmentIndex: number) => void;
  selectedSegmentIndex: number | null;
}

const statusIcons = {
  start: PlayCircle,
  driving: Car,
  stop: PauseCircle,
  end: Flag,
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

function RouteHistoryContent({ events, vehicle, onSegmentSelect, selectedSegmentIndex }: Omit<RouteHistorySheetProps, 'isOpen' | 'onOpenChange'>) {
    const totalDistance = events.reduce((sum, e) => sum + e.distanceKm, 0);
    const totalDuration = events.reduce((sum, e) => sum + e.durationMinutes, 0);
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
              <CardTitle>Route History: {vehicle?.vehicleId}</CardTitle>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
              </div>
            </CardHeader>
            <CardContent className="pb-4 flex-1">
              <ScrollArea className="w-full whitespace-nowrap h-full" viewportRef={scrollContainerRef}>
                <div className="relative flex items-stretch gap-0 px-4 pb-4 h-full">
                  {events.map((event, index) => {
                    const Icon = statusIcons[event.status];
                    const isSelected = selectedSegmentIndex === index;

                    return (
                      <div
                        key={index}
                        ref={el => itemRefs.current[index] = el}
                        className={cn(
                          "flex-shrink-0 group transition-all duration-300",
                           isSelected ? 'scale-105' : 'scale-100'
                        )}
                        style={{ width: index === events.length -1 ? 'auto' : '180px'}}
                        onClick={() => onSegmentSelect(index)}
                      >
                        <div className="relative flex flex-col items-center text-center cursor-pointer h-full">
                          {/* Timeline line */}
                          {index < events.length - 1 && (
                            <div className={cn(
                                "absolute top-4 left-1/2 h-0.5 w-full bg-border transition-colors",
                                isSelected ? 'bg-primary' : 'group-hover:bg-primary'
                            )} />
                          )}

                          <div className={cn(
                              "z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card ring-4 transition-all",
                              isSelected ? 'ring-primary' : 'ring-card group-hover:ring-primary'
                          )}>
                            <Icon className="h-5 w-5 text-primary" />
                          </div>

                          <div className="pt-2">
                             <p className={cn(
                                 "font-semibold capitalize text-sm transition-colors",
                                 isSelected ? 'text-primary-foreground' : 'text-foreground'
                              )}>
                              {event.status}
                            </p>
                            <p className="text-xs text-muted-foreground whitespace-normal pt-1 px-1 h-10">
                              {event.description}
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

  if (isMobile) {
    return (
        <Drawer open={props.isOpen} onOpenChange={props.onOpenChange}>
            <DrawerContent className="h-[40%]">
                <RouteHistoryContent {...props} />
            </DrawerContent>
      </Drawer>
    )
  }

  return (
    <AnimatePresence>
      {props.isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-4 left-4 right-4 z-20"
        >
          <RouteHistoryContent {...props} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
