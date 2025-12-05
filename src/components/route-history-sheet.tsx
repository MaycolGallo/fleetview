'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface RouteHistorySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  events: RouteEvent[];
  vehicle: Vehicle | null;
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
  onOpenChange,
  events,
  vehicle,
}: RouteHistorySheetProps) {
  const totalDistance = events.reduce((sum, e) => sum + e.distanceKm, 0);
  const totalDuration = events.reduce((sum, e) => sum + e.durationMinutes, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[60%] sm:h-[50%] flex flex-col"
      >
        <SheetHeader className="pr-12">
          <SheetTitle className="text-2xl">
            Route History: {vehicle?.vehicleId}
          </SheetTitle>
          <SheetDescription>
            A detailed log of the vehicle's recent trip.
          </SheetDescription>
        </SheetHeader>
        <div className="flex items-center gap-6 text-sm text-muted-foreground border-t border-b py-3 mt-2">
          <div className="flex items-center gap-2">
            <Milestone className="w-5 h-5 text-primary" />
            <span>
              Total Distance:{' '}
              <strong className="text-foreground">
                {totalDistance.toFixed(1)} km
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>
              Total Time:{' '}
              <strong className="text-foreground">
                {formatDuration(totalDuration)}
              </strong>
            </span>
          </div>
        </div>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="relative py-6">
            {/* Timeline line */}
            <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-border" />
            <ul className="space-y-8">
              {events.map((event, index) => {
                const Icon = statusIcons[event.status];
                return (
                  <li key={index} className="flex items-start gap-4">
                    <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card ring-4 ring-card">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 mt-1">
                      <p className="font-semibold text-foreground capitalize">
                        {event.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {format(parseISO(event.timestamp), 'p')}
                        </span>
                        {event.durationMinutes > 0 && (
                          <>
                            <Separator
                              orientation="vertical"
                              className="h-3"
                            />
                            <span>{formatDuration(event.durationMinutes)}</span>
                          </>
                        )}
                        {event.distanceKm > 0 && (
                          <>
                            <Separator
                              orientation="vertical"
                              className="h-3"
                            />
                            <span>{event.distanceKm.toFixed(1)} km</span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
