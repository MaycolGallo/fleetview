'use client';

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import React, { useState, useRef, MouseEvent, useCallback } from 'react';
import { Gauge } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFleetState, useFleetDispatch, statusDetailsMap } from '@/context/fleet-context';
import { useAnimatedPosition } from '@/hooks/use-animated-position';
import { VehicleContextMenu } from './vehicle-context-menu';
import { VehicleMobileContextMenu } from './vehicle-mobile-context-menu';
import { cn } from '@/lib/utils';

function AnimatedVehicleMarkerComponent({ vehicle }: { vehicle: Vehicle }) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { selectedVehicle, isRoutePlaying, historyVehicle } = state;
  const isSelected = selectedVehicle?.id === vehicle.id;
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  const isPlaybackMarker = historyVehicle?.id === vehicle.id;
  const targetPosition = { lat: vehicle.lat, lng: vehicle.lng };
  const animatedPosition = useAnimatedPosition(targetPosition);

  // During playback, we want the marker to snap to the exact location from the data.
  // The useAnimatedPosition hook is for smooth transitions when clicking, but it causes a lag during rapid playback.
  // By using the targetPosition directly, the marker will perfectly follow the polyline.
  const position = isPlaybackMarker && isRoutePlaying ? targetPosition : animatedPosition;

  const handleLeftClick = (e: google.maps.MapMouseEvent | MouseEvent) => {
    if ('domEvent' in e && e.domEvent) {
      e.domEvent.stopPropagation();
    } else if (e.stopPropagation) {
      e.stopPropagation();
    }
    dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile) return;
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    pressTimer.current = setTimeout(() => {
      if (isMobile) {
        setDrawerOpen(true);
      } else {
        const touch = e.touches[0];
        setContextMenuPosition({ x: touch.clientX, y: touch.clientY });
        setContextMenuOpen(true);
      }
    }, 500); // 500ms for a long press
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const color = statusDetailsMap[vehicle.status as keyof typeof statusDetailsMap]?.color || '#9E9E9E';

  return (
    <>
      <AdvancedMarker
        key={vehicle.id}
        position={position}
        onClick={handleLeftClick}
        zIndex={isSelected ? 10 : 1}
      >
        <div
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            data-vehicle-id={vehicle.id}
            className={cn(
                "relative cursor-pointer flex justify-center items-center transition-transform duration-300",
                isSelected && 'scale-125'
            )}
        >
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-10"
            >
                <div
                    style={{ backgroundColor: color }}
                    className="flex items-center gap-1 shadow-md rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap text-white"
                >
                    <Gauge className="w-3 h-3" />
                    <span>{vehicle.velocidad}</span>
                </div>
            </div>

          <VehiclePin
            vehicle={vehicle}
            isSelected={isSelected}
          />
        </div>
      </AdvancedMarker>

       {contextMenuOpen && !isMobile && (
        <VehicleContextMenu
          vehicle={vehicle}
          position={contextMenuPosition}
          onClose={() => setContextMenuOpen(false)}
        />
      )}

      {isMobile && (
         <VehicleMobileContextMenu
            isOpen={drawerOpen}
            onOpenChange={setDrawerOpen}
            vehicle={vehicle}
        />
      )}
    </>
  );
}

export const AnimatedVehicleMarker = React.memo(AnimatedVehicleMarkerComponent);