'use client';

import { Drawer, DrawerContent, DrawerHandle, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFleetState, useFleetDispatch, selectRouteSummary } from '@/context/fleet-context';
import { RouteHistoryContent } from './route-history-content';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from './ui/button';
import { Clock, Milestone, ParkingSquare, Pause, Play } from 'lucide-react';

interface RouteHistorySheetProps {}

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


export function RouteHistorySheet(props: RouteHistorySheetProps) {
  const isMobile = useIsMobile();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isRouteSheetOpen, isRoutePlaying, routeSegments, historyVehicle } = state;
  const { totalDistance, totalDuration, totalStops, totalStopTime } = useMemo(() => selectRouteSummary(state), [state]);

  const playbackIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const movingPoints = useMemo(() => {
    if (!isRouteSheetOpen) return [];
    return routeSegments
        .filter(seg => seg.id_estado === '6')
        .flatMap(seg => seg.records.map(r => {
            const [lat, lng] = r.coordenadas.split(',').map(Number);
            return { lat, lng, rumbo: r.rumbo, fecha: r.fecha, velocidad: parseInt(r.velocidad, 10) || 0 };
        }));
  }, [isRouteSheetOpen, routeSegments]);

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
    
    // If play is hit again, always restart from the beginning
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

    // Kick off the first frame
    playNextPoint();

    // The effect's cleanup function handles pausing/stopping
    return cleanup;
  // This effect should only re-run when `isRoutePlaying` changes.
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

  const handleSegmentSelect = useCallback((segmentIndex: number) => {
    dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
    dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: segmentIndex });
  }, [dispatch]);

   const handlePlayPause = useCallback(() => {
    if (isRoutePlaying) {
        dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
    } else {
        dispatch({ type: 'START_ROUTE_PLAYBACK' });
    }
  }, [dispatch, isRoutePlaying]);
  
  if (isMobile) {
    return (
        <Drawer open={isRouteSheetOpen} onOpenChange={handleOpenChange}>
            <DrawerContent className="h-[60%] flex flex-col">
                <DrawerHandle />
                <DrawerHeader className="text-left p-4 pt-0 pb-2 flex-shrink-0">
                     <div className="flex justify-between items-start gap-4">
                        <div>
                            <DrawerTitle>Route History: {historyVehicle?.placa}</DrawerTitle>
                            <DrawerDescription asChild>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2">
                                    <div className="flex items-center gap-1.5">
                                    <Milestone className="w-3 h-3 text-primary" />
                                    <span>
                                        Total Distance:{' '}
                                        <strong className="text-foreground">
                                        {totalDistance.toFixed(1)} km
                                        </strong>
                                    </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-primary" />
                                    <span>
                                        Total Time:{' '}
                                        <strong className="text-foreground">
                                        {formatDuration(totalDuration)}
                                        </strong>
                                    </span>
                                    </div>
                                    {totalStops > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <ParkingSquare className="w-3 h-3 text-primary" />
                                            <span>
                                                {totalStops} stops{' '}
                                                <strong className="text-foreground">
                                                    ({formatDuration(totalStopTime)})
                                                </strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </DrawerDescription>
                        </div>
                        <Button size="icon" onClick={handlePlayPause} className="flex-shrink-0">
                            {isRoutePlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            <span className="sr-only">{isRoutePlaying ? 'Pause' : 'Play'}</span>
                        </Button>
                    </div>
                </DrawerHeader>
                <RouteHistoryContent onSegmentSelect={handleSegmentSelect} />
            </DrawerContent>
      </Drawer>
    )
  }

  return (
    <>
      {isRouteSheetOpen && (
        <div
          style={{ viewTransitionName: 'route-sheet-transition' }}
          className="absolute bottom-4 left-4 right-4 z-20 h-[250px]"
        >
          <RouteHistoryContent onSegmentSelect={handleSegmentSelect} />
        </div>
      )}
    </>
  );
}
