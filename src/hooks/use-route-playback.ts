'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';

export function useRoutePlayback() {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isRoutePlaying, isRouteSheetOpen, routeGroups } = state;
  
  const playbackIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const movingPoints = useMemo(() => {
    if (!isRouteSheetOpen) return [];
    return routeGroups
        .filter(seg => seg.id_estado === 6)
        .flatMap(seg => seg.records.map(r => ({
            lat: r.lat,
            lng: r.lng,
            rumbo: r.rumbo,
            fecha: r.fecha,
            velocidad: parseInt(r.velocidad, 10) || 0
        })));
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
    
    // Reset playback index when starting fresh or reaching the end
    if (playbackIndexRef.current >= movingPoints.length - 1) {
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
            delay = 500;
        }

        dispatch({ 
            type: 'UPDATE_HISTORY_VEHICLE_POSITION', 
            payload: { 
                lat: currentPoint.lat, 
                lng: currentPoint.lng, 
                rumbo: currentPoint.rumbo, 
                velocidad: currentPoint.velocidad, 
                animationDuration: delay 
            } 
        });
        
        dispatch({ type: 'SET_PLAYBACK_INDEX', payload: nextIndex });
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
  }, [isRoutePlaying, dispatch, movingPoints]);

  return { isRoutePlaying, movingPoints };
}
