

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

  const movingPoints = useMemo(() => {
    if (!isRouteSheetOpen) return [];
    return routeSegments
        .filter(seg => seg.id_estado === '6')
        .flatMap(seg => seg.records.map(r => {
            const [lat, lng] = r.coordenadas.split(',').map(Number);
            return { lat, lng, rumbo: r.rumbo };
        }));
  }, [isRouteSheetOpen, routeSegments]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // If not playing, do nothing and ensure cleanup.
    if (!isRoutePlaying) {
      return;
    }

    if (movingPoints.length === 0) {
        dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
        return;
    }

    // This effect runs whenever `isRoutePlaying` becomes true.
    // We ALWAYS reset and start from the beginning.
    playbackIndexRef.current = 0;

    const playNextPoint = () => {
        if (playbackIndexRef.current >= movingPoints.length) {
            dispatch({ type: 'PAUSE_ROUTE_PLAYBACK' });
            return;
        }

        const point = movingPoints[playbackIndexRef.current];
        dispatch({ type: 'UPDATE_HISTORY_VEHICLE_POSITION', payload: point });
        
        playbackIndexRef.current++;

        timeoutId = setTimeout(playNextPoint, 50); // Slowed down animation
    };

    playNextPoint();
    
    return () => {
      // Cleanup function to stop the loop when component unmounts or `isRoutePlaying` becomes false.
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isRoutePlaying, dispatch, movingPoints]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
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
