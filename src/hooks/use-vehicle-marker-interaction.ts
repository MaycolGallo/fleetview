
'use client';

import { useState, useRef, useCallback } from 'react';
import { useFleetDispatch } from '@/context/fleet-context';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Vehicle } from '@/lib/types';

interface UseVehicleMarkerInteractionProps {
  vehicle: Vehicle;
}

export function useVehicleMarkerInteraction({ vehicle }: UseVehicleMarkerInteractionProps) {
  const dispatch = useFleetDispatch();
  const isMobile = useIsMobile();
  
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLeftClick = useCallback((e: google.maps.MapMouseEvent | React.MouseEvent) => {
    if ('domEvent' in e && e.domEvent) {
      e.domEvent.stopPropagation();
    } else if ('stopPropagation' in e) {
      e.stopPropagation();
    }
    // Restored PAN_TO_VEHICLE to fulfill user request "when click i want to do pan"
    dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
  }, [dispatch, vehicle]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile) return;
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  }, [isMobile]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    pressTimer.current = setTimeout(() => {
      if (isMobile) {
        setDrawerOpen(true);
      } else {
        const touch = e.touches[0];
        setContextMenuPosition({ x: touch.clientX, y: touch.clientY });
        setContextMenuOpen(true);
      }
    }, 500); 
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const closeContextMenu = useCallback(() => setContextMenuOpen(false), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return {
    contextMenuOpen,
    contextMenuPosition,
    drawerOpen,
    setDrawerOpen,
    handleLeftClick,
    handleContextMenu,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    closeContextMenu,
    closeDrawer
  };
}
