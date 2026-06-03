'use client';

import { Drawer, DrawerContent, DrawerHandle, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useFleetState, useFleetDispatch, selectRouteSummary } from '@/context/fleet-context';
import { RouteHistoryContent } from './route-history-content';
import { useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Milestone, ParkingSquare, Pause, Play, Truck, RefreshCw } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRoutePlayback } from '@/hooks/use-route-playback';
import { useHorizontalScroll } from '@/hooks/use-horizontal-scroll';

interface RouteHistorySheetProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  onApply: () => void;
}

function formatDuration(minutes: number) {
  const totalSeconds = Math.round(minutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function RouteHistorySheet({ date, setDate, onApply }: RouteHistorySheetProps) {
  const isMobile = useIsMobile();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isRouteSheetOpen, routeGroups, historyVehicle, by_estado, selectedSegmentIndex, lastUpdatedRoute } = state;
  const { totalDistance, totalDuration } = useMemo(() => selectRouteSummary(state), [state]);
  
  // Custom hook for route playback logic
  const { isRoutePlaying } = useRoutePlayback();

  // Custom hook for horizontal scroll management
  const { scrollContainerRef, canScrollLeft, canScrollRight, scroll, checkScroll } = useHorizontalScroll();

  useEffect(() => {
    if (isRouteSheetOpen) {
        checkScroll();
    }
  }, [isRouteSheetOpen, routeGroups, checkScroll]);

  const statusColorMap = useMemo(() => {
    const map = new Map<number, string>();
    state.routeGroups.forEach(g => {
        if (!map.has(g.id_estado)) map.set(g.id_estado, g.color);
    });
    return map;
  }, [state.routeGroups]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
        dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' }); 
        dispatch({ type: 'BACK_TO_FLEET' });
    }
  }, [dispatch]);

   const handlePlayPause = useCallback(() => {
    if (isRoutePlaying) dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
    else dispatch({ type: 'START_ROUTE_PLAYBACK' });
  }, [dispatch, isRoutePlaying]);

  const handleSegmentNav = (dir: 'next' | 'prev') => {
    const maxIndex = routeGroups.length - 1;
    if (dir === 'next') {
      const next = selectedSegmentIndex === null ? 0 : Math.min(maxIndex, selectedSegmentIndex + 1);
      dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: next });
    } else {
      const prev = selectedSegmentIndex === null ? maxIndex : Math.max(0, selectedSegmentIndex - 1);
      dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: prev });
    }
  };
  
  if (isMobile) {
    return (
        <Drawer open={isRouteSheetOpen} onOpenChange={handleOpenChange} modal={false}>
            <DrawerContent className="h-[60%] flex flex-col">
                <DrawerHandle />
                <DrawerHeader className="text-left p-4 pt-0 pb-2 flex-shrink-0">
                     <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 overflow-hidden">
                            <DrawerTitle className="truncate">Ruta: {historyVehicle?.placa}</DrawerTitle>
                            <DrawerDescription asChild>
                                <div className="flex flex-col gap-1 mt-2">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <Milestone className="w-3 h-3 text-primary" />
                                            <span>Dist: <strong className="text-foreground">{totalDistance.toFixed(1)} km</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3 h-3 text-primary" />
                                            <span>Time: <strong className="text-foreground">{formatDuration(totalDuration)}</strong></span>
                                        </div>
                                    </div>
                                    {lastUpdatedRoute && (
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <RefreshCw className="w-2.5 h-2.5" />
                                            Actualizado: {format(lastUpdatedRoute, 'HH:mm:ss')}
                                        </div>
                                    )}
                                </div>
                            </DrawerDescription>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleSegmentNav('prev')} disabled={selectedSegmentIndex === 0}><ChevronLeft className="w-5 h-5" /></Button>
                            <Button size="icon" onClick={handlePlayPause} className="h-10 w-10"><Play className="w-5 h-5" /></Button>
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleSegmentNav('next')} disabled={selectedSegmentIndex === routeGroups.length - 1}><ChevronRight className="w-5 h-5" /></Button>
                        </div>
                    </div>
                </DrawerHeader>
                <div key={lastUpdatedRoute} className={cn("flex-1 min-h-0", lastUpdatedRoute && "animate-data-pulse")}>
                  <RouteHistoryContent />
                </div>
            </DrawerContent>
      </Drawer>
    )
  }

  const statusIconMap: { [key: number]: React.ElementType } = { 4: Clock, 5: ParkingSquare, 6: Truck };
  
  return (
    <>
      {isRouteSheetOpen && (
        <div style={{ viewTransitionName: 'route-sheet-transition' }} className="absolute bottom-4 left-4 right-4 z-20">
          <Card className="max-w-full mx-auto bg-card/95 backdrop-blur-md border-primary/20 shadow-2xl h-auto flex flex-col overflow-hidden">
            <CardHeader className="pb-2 border-b">
                <div>
                    <div className="flex justify-between items-center gap-4 mb-4">
                        <div className='flex items-center gap-4'>
                            <div className="text-2xl font-semibold flex items-center gap-3">
                                {historyVehicle?.placa}
                                {lastUpdatedRoute && (
                                    <Badge variant="secondary" className="text-[10px] h-5">
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                        {format(lastUpdatedRoute, 'HH:mm:ss')}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className='flex items-center gap-6'>
                            <div className='text-right'>
                                <p className='text-xs text-muted-foreground uppercase tracking-wider'>Duración</p>
                                <p className='text-xl font-semibold'>{formatDuration(totalDuration)}</p>
                            </div>
                            <div className='text-right'>
                                <p className='text-xs text-muted-foreground uppercase tracking-wider'>Distancia</p>
                                <p className='text-xl font-semibold text-primary'>{totalDistance.toFixed(2)}km</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" onClick={handlePlayPause} className="flex-shrink-0 shadow-md h-12 w-12 rounded-full">
                                    {isRoutePlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-x-6 gap-y-2 text-sm text-muted-foreground flex-wrap border-t pt-2 transition-colors">
                        {Object.entries(by_estado).map(([statusId, statusData]) => {
                            const Icon = statusIconMap[Number(statusId)] || Milestone;
                            return (
                                <div key={statusId} className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" style={{ color: statusColorMap.get(Number(statusId)) || 'hsl(var(--primary))' }} />
                                    <span className='font-medium text-foreground uppercase text-xs'>{statusData.name}:</span>
                                    <span className="text-xs">{statusData.total_distance_km.toFixed(2)}km</span>
                                    <span className='text-border'>/</span>
                                    <span className="text-xs">{statusData.total_time_formatted}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardHeader>
            <div key={lastUpdatedRoute} className={cn("relative flex items-center h-[180px]", lastUpdatedRoute && "animate-data-pulse")}>
                {canScrollLeft && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
                      <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full shadow-lg border-2 border-primary/20 hover:scale-110 transition-transform bg-card/90" onClick={() => scroll('left')}>
                          <ChevronLeft className="w-8 h-8" />
                      </Button>
                  </div>
                )}
                <div className="flex-1 w-full overflow-hidden"><RouteHistoryContent viewportRef={scrollContainerRef} /></div>
                {canScrollRight && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                      <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full shadow-lg border-2 border-primary/20 hover:scale-110 transition-transform bg-card/90" onClick={() => scroll('right')}>
                          <ChevronRight className="w-8 h-8" />
                      </Button>
                  </div>
                )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
