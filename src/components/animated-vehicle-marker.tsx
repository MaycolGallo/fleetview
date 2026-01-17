
'use client';

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import React, { useState, useRef, MouseEvent } from 'react';
import { Gauge } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';
import { useFleet, statusDetailsMap } from '@/context/fleet-context';
import { useAnimatedPosition } from '@/hooks/use-animated-position';
import { motion } from 'framer-motion';
import { VehicleContextMenu } from './vehicle-context-menu';
import { VehicleMobileContextMenu } from './vehicle-mobile-context-menu';

function AnimatedVehicleMarkerComponent({ vehicle }: { vehicle: Vehicle }) {
  const { state, dispatch } = useFleet();
  const { selectedVehicle } = state;
  const isSelected = selectedVehicle?.id === vehicle.id;
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  const targetPosition = { lat: vehicle.lat, lng: vehicle.lng };
  const animatedPosition = useAnimatedPosition(targetPosition);

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
        position={animatedPosition}
        onClick={handleLeftClick}
        zIndex={isSelected ? 10 : 1}
      >
        <motion.div
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            data-vehicle-id={vehicle.id}
            className="relative cursor-pointer flex justify-center items-center"
            animate={{
              scale: isSelected ? 1.2 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
        </motion.div>
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
