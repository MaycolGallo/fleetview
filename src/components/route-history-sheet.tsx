
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { RouteEvent, Vehicle } from '@/lib/types';
import {
  PlayCircle,
  PauseCircle,
  Car,
  Flag,
  Clock,
  Milestone,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

interface RouteHistorySheetProps {
  isOpen: boolean;
  events: RouteEvent[];
  vehicle: Vehicle | null;
  onSegmentSelect: (segmentIndex: number) => void;
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

export function RouteHistorySheet({
  isOpen,
  events,
  vehicle,
  onSegmentSelect,
}: RouteHistorySheetProps) {
  const totalDistance = events.reduce((sum, e) => sum + e.distanceKm, 0);
  const totalDuration = events.reduce((sum, e) => sum + e.durationMinutes, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-4 left-4 right-4 z-20"
        >
          <Card className="max-w-full mx-auto bg-card/90 backdrop-blur-sm border-primary/20 shadow-2xl">
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
            <CardContent className="pb-4">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="relative flex items-stretch gap-0 px-4 pb-4">
                  {events.map((event, index) => {
                    const Icon = statusIcons[event.status];
                    return (
                      <div
                        key={index}
                        className="flex-shrink-0 group"
                        style={{ width: index === events.length -1 ? 'auto' : '180px'}}
                        onClick={() => onSegmentSelect(index)}
                      >
                        <div className="relative flex flex-col items-center text-center cursor-pointer">
                          {/* Timeline line */}
                          {index < events.length - 1 && (
                            <div className="absolute top-4 left-1/2 h-0.5 w-full bg-border group-hover:bg-primary transition-colors" />
                          )}

                          <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card ring-4 ring-card -mt-4 group-hover:ring-primary transition-all">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>

                          <div className="pt-2">
                             <p className="font-semibold text-foreground capitalize text-sm">
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
