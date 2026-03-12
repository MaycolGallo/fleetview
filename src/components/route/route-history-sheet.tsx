
'use client';

import { Drawer, DrawerContent, DrawerHandle, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useFleetState, useFleetDispatch, selectRouteSummary } from '@/context/fleet-context';
import { RouteHistoryContent } from './route-history-content';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronLeft, ChevronRight, Clock, Milestone, ParkingSquare, Pause, Play, Truck } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface RouteHistorySheetProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  onApply: () => void;
}

function formatDuration(minutes: number) {
  const totalSeconds = Math.round(minutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);

  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}


export function RouteHistorySheet({ date, setDate, onApply }: RouteHistorySheetProps) {
  const isMobile = useIsMobile();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isRouteSheetOpen, isRoutePlaying, routeGroups, historyVehicle, by_estado, selectedSegmentIndex } = state;
  const { totalDistance, totalDuration } = useMemo(() => selectRouteSummary(state), [state]);
  
  const playbackIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const statusColorMap = useMemo(() => {
    const map = new Map<number, string>();
    state.routeGroups.forEach(g => {
        if (!map.has(g.id_estado)) {
            map.set(g.id_estado, g.color);
        }
    });
    return map;
}, [state.routeGroups]);

  const movingPoints = useMemo(() => {
    if (!isRouteSheetOpen) return [];
    return routeGroups
        .filter(seg => seg.id_estado === 6) // Transitando
        .flatMap(seg => seg.records.map(r => {
            return { lat: r.lat, lng: r.lng, rumbo: r.rumbo, fecha: r.fecha, velocidad: parseInt(r.velocidad, 10) || 0 };
        }));
  }, [isRouteSheetOpen, routeGroups]);

  useEffect(() => {
    const cleanup = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    if (!isRoutePlaying) {
        cleanup();
        return;
    }
    
    if (playbackIndexRef.current >= movingPoints.length -1 || playbackIndexRef.current === 0) {
        playbackIndexRef.current = 0;
    }
    
    if (movingPoints.length === 0) {
        dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
        return;
    }

    const playNextPoint = () => {
        const currentIndex = playbackIndexRef.current;
        
        if (currentIndex >= movingPoints.length) {
            dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
            cleanup();
            return;
        }

        const currentPoint = movingPoints[currentIndex];
        const nextIndex = currentIndex + 1;
        
        let delay;
        if (nextIndex < movingPoints.length) {
            const nextPoint = movingPoints[nextIndex];
            const timeDiffSeconds = nextPoint.fecha - currentPoint.fecha;
            
            const PLAYBACK_SPEED_MULTIPLIER = 10;
            delay = (timeDiffSeconds * 1000) / PLAYBACK_SPEED_MULTIPLIER;
            delay = Math.max(50, Math.min(delay, 500));
        } else {
            delay = 500; // Final animation
        }

        dispatch({ type: 'UPDATE_HISTORY_VEHICLE_POSITION', payload: { lat: currentPoint.lat, lng: currentPoint.lng, rumbo: currentPoint.rumbo, velocidad: currentPoint.velocidad, animationDuration: delay } });
        
        playbackIndexRef.current = nextIndex;

        if (nextIndex < movingPoints.length && isRoutePlaying) {
            timeoutRef.current = setTimeout(playNextPoint, delay);
        } else {
             dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
             cleanup();
        }
    };

    playNextPoint();

    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRoutePlaying, dispatch]);


  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
        dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' }); // Stop playback when closing
        // @ts-ignore
        if (document.startViewTransition) {
            // @ts-ignore
            document.startViewTransition(() => {
                dispatch({ type: 'BACK_TO_FLEET' });
            });
        } else {
            dispatch({ type: 'BACK_TO_FLEET' });
        }
    }
  }, [dispatch]);

   const handlePlayPause = useCallback(() => {
    if (isRoutePlaying) {
        dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
    } else {
        dispatch({ type: 'START_ROUTE_PLAYBACK' });
    }
  }, [dispatch, isRoutePlaying]);

  const handleNextSegment = useCallback(() => {
    const maxIndex = routeGroups.length - 1;
    if (selectedSegmentIndex === null) {
      dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: 0 });
    } else if (selectedSegmentIndex < maxIndex) {
      dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: selectedSegmentIndex + 1 });
    }
  }, [dispatch, routeGroups.length, selectedSegmentIndex]);

  const handlePrevSegment = useCallback(() => {
    if (selectedSegmentIndex === null) {
      dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: routeGroups.length - 1 });
    } else if (selectedSegmentIndex > 0) {
      dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: selectedSegmentIndex - 1 });
    }
  }, [dispatch, routeGroups.length, selectedSegmentIndex]);
  
  if (isMobile) {
    return (
        <Drawer open={isRouteSheetOpen} onOpenChange={handleOpenChange} modal={false}>
            <DrawerContent className="h-[60%] flex flex-col">
                <DrawerHandle />
                <DrawerHeader className="text-left p-4 pt-0 pb-2 flex-shrink-0">
                     <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 overflow-hidden">
                            <DrawerTitle className="truncate">Route: {historyVehicle?.placa}</DrawerTitle>
                            <DrawerDescription asChild>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2">
                                    <div className="flex items-center gap-1.5">
                                    <Milestone className="w-3 h-3 text-primary" />
                                    <span>
                                        Dist:{' '}
                                        <strong className="text-foreground">
                                        {totalDistance.toFixed(1)} km
                                        </strong>
                                    </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-primary" />
                                    <span>
                                        Time:{' '}
                                        <strong className="text-foreground">
                                        {formatDuration(totalDuration)}
                                        </strong>
                                    </span>
                                    </div>
                                </div>
                            </DrawerDescription>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <Button 
                                variant="outline"
                                size="icon" 
                                className="h-9 w-9"
                                onClick={handlePrevSegment}
                                disabled={selectedSegmentIndex === 0}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button size="icon" onClick={handlePlayPause} className="h-10 w-10 flex-shrink-0">
                                {isRoutePlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </Button>
                            <Button 
                                variant="outline"
                                size="icon" 
                                className="h-9 w-9"
                                onClick={handleNextSegment}
                                disabled={selectedSegmentIndex === routeGroups.length - 1}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </DrawerHeader>
                <div className="flex-1 min-h-0">
                  <RouteHistoryContent />
                </div>
            </DrawerContent>
      </Drawer>
    )
  }

  const statusIconMap: { [key: number]: React.ElementType } = {
    4: Clock, // Ralenti
    5: ParkingSquare, // Estacionado
    6: Truck, // Transitando
  };
  
  // Desktop layout
  const headerContent = (
      <div>
        <div className="flex justify-between items-center gap-4 mb-4">
            <div className='flex items-center gap-4'>
                <Button variant="ghost" className="text-2xl font-semibold p-0 h-auto focus-visible:ring-inset">
                    {historyVehicle?.placa}
                    <ChevronDown className="w-5 h-5 ml-2" />
                </Button>
            </div>
            <div className='flex items-center gap-6'>
                <div className='text-right'>
                    <p className='text-xs text-muted-foreground uppercase tracking-wider'>Duration</p>
                    <p className='text-xl font-semibold'>{formatDuration(totalDuration)}</p>
                </div>
                <div className='text-right'>
                    <p className='text-xs text-muted-foreground uppercase tracking-wider'>Distance</p>
                    <p className='text-xl font-semibold text-primary'>{totalDistance.toFixed(2)}km</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handlePrevSegment}
                        disabled={selectedSegmentIndex === 0 || selectedSegmentIndex === null}
                        className="shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button size="icon" onClick={handlePlayPause} className="flex-shrink-0 shadow-md h-12 w-12 rounded-full">
                        {isRoutePlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleNextSegment}
                        disabled={selectedSegmentIndex === routeGroups.length - 1}
                        className="shadow-sm"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-x-6 gap-y-2 text-sm text-muted-foreground flex-wrap border-t pt-2">
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
    );

  return (
    <>
      {isRouteSheetOpen && (
        <div
          style={{ viewTransitionName: 'route-sheet-transition' }}
          className="absolute bottom-4 left-4 right-4 z-20"
        >
          <Card className="max-w-full mx-auto bg-card/95 backdrop-blur-md border-primary/20 shadow-2xl h-auto flex flex-col overflow-hidden">
            <CardHeader className="pb-2 border-b">{headerContent}</CardHeader>
            <div className="relative flex items-center h-[180px]">
                {/* Visual Navigation Overlay Buttons */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
                     <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-12 w-12 rounded-full shadow-lg border-2 border-primary/20 hover:scale-110 transition-transform"
                        onClick={handlePrevSegment}
                        disabled={selectedSegmentIndex === 0 || selectedSegmentIndex === null}
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </Button>
                </div>

                <div className="flex-1 w-full overflow-hidden">
                    <RouteHistoryContent />
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-12 w-12 rounded-full shadow-lg border-2 border-primary/20 hover:scale-110 transition-transform"
                        onClick={handleNextSegment}
                        disabled={selectedSegmentIndex === routeGroups.length - 1}
                    >
                        <ChevronRight className="w-8 h-8" />
                    </Button>
                </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
