'use client';

import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { RouteHistoryContent } from './route-history-content';
import { useCallback, useEffect, useMemo, useRef } from 'react';

interface RouteHistorySheetProps {}

export function RouteHistorySheet(props: RouteHistorySheetProps) {
  const isMobile = useIsMobile();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isRouteSheetOpen, isRoutePlaying, routeSegments } = state;

  const playbackIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const movingPoints = useMemo(() => {
    if (!isRouteSheetOpen) return [];
    return routeSegments
        .filter(seg => seg.id_estado === '6')
        .flatMap(seg => seg.records.map(r => {
            const [lat, lng] = r.coordenadas.split(',').map(Number);
            return { lat, lng, rumbo: r.rumbo, fecha: r.fecha };
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
    
    cleanup();
    playbackIndexRef.current = 0; // ALWAYS restart from the beginning
    
    if (movingPoints.length === 0) {
        dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
        return;
    }

    const playNextPoint = () => {
        const currentIndex = playbackIndexRef.current;
        
        // Safety check in case isRoutePlaying changed during the timeout
        if (!isRoutePlaying || currentIndex >= movingPoints.length) {
            dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
            cleanup();
            return;
        }

        const currentPoint = movingPoints[currentIndex];
        dispatch({ type: 'UPDATE_HISTORY_VEHICLE_POSITION', payload: { lat: currentPoint.lat, lng: currentPoint.lng, rumbo: currentPoint.rumbo } });

        const nextIndex = currentIndex + 1;
        playbackIndexRef.current = nextIndex;

        if (nextIndex < movingPoints.length) {
            const nextPoint = movingPoints[nextIndex];
            const timeDiffSeconds = nextPoint.fecha - currentPoint.fecha;
            
            // Speed up real time. Higher number = faster playback.
            const PLAYBACK_SPEED_MULTIPLIER = 100;
            let delay = (timeDiffSeconds * 1000) / PLAYBACK_SPEED_MULTIPLIER;

            // Clamp the delay to ensure a smooth animation, not too fast, not too slow.
            // Min: 50ms (~20fps), Max: 500ms (half a second)
            delay = Math.max(50, Math.min(delay, 500));

            timeoutRef.current = setTimeout(playNextPoint, delay);
        } else {
             // Reached the end of the points
             dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
             cleanup();
        }
    };

    // Kick off the first frame
    playNextPoint();

    // The effect's cleanup function handles pausing/stopping
    return cleanup;
  }, [isRoutePlaying, dispatch, movingPoints]);


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
    <>
      {isRouteSheetOpen && (
        <div
          style={{ viewTransitionName: 'route-sheet-transition' }}
          className="absolute bottom-4 left-4 right-4 z-20"
        >
          <RouteHistoryContent onSegmentSelect={handleSegmentSelect} />
        </div>
      )}
    </>
  );
}
