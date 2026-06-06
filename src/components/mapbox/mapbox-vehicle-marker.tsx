
'use client';

import React from 'react';
import { Marker, Popup } from 'react-map-gl';
import type { Vehicle } from '@/lib/types';
import { useAnimatedPosition } from '@/hooks/use-animated-position';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { VehiclePin } from '@/components/vehicle/vehicle-pin';
import { Gauge } from 'lucide-react';
import { useVehicleMarkerInteraction } from '@/hooks/use-vehicle-marker-interaction';
import { useIsMobile } from '@/hooks/use-mobile';
import { VehicleContextMenu } from '@/components/vehicle/vehicle-context-menu';
import { VehicleMobileContextMenu } from '@/components/vehicle/vehicle-mobile-context-menu';
import { motion } from 'framer-motion';
import { VehicleMapPopupContent } from '../vehicle/vehicle-map-popup-content';

interface MapboxVehicleMarkerProps {
  vehicle: Vehicle;
  index?: number;
  showPopup?: boolean;
}

export function MapboxVehicleMarker({ vehicle, index = 0, showPopup = false }: MapboxVehicleMarkerProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const isMobile = useIsMobile();
  
  const { selectedVehicle, isRoutePlaying, historyVehicle, playbackAnimationDuration } = state;
  const isSelected = selectedVehicle?.id_vehiculo === vehicle.id_vehiculo;

  const {
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
  } = useVehicleMarkerInteraction({ vehicle });

  const isPlaybackMarker = !!historyVehicle;
  const targetPosition = { lat: vehicle.lat, lng: vehicle.lng };
  
  const animationDuration = (isPlaybackMarker && isRoutePlaying) ? playbackAnimationDuration : 1000;
  const animatedPosition = useAnimatedPosition(targetPosition, { duration: animationDuration });

  const speed = parseFloat(vehicle.velocidad) || 0;
  const color = vehicle.statusColor || '#9E9E9E';

  return (
    <>
      <Marker 
        latitude={animatedPosition.lat} 
        longitude={animatedPosition.lng}
        anchor={isPlaybackMarker ? 'center' : 'bottom'}
        onClick={(e) => {
            e.originalEvent.stopPropagation();
            handleLeftClick(e.originalEvent);
        }}
        style={{ zIndex: isSelected ? 1000 : index }}
      >
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
                scale: isSelected ? 1.25 : 1,
                opacity: 1
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            className="cursor-pointer relative flex flex-col items-center"
        >
          {speed > 0 && !isPlaybackMarker && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-10">
                  <div
                      style={{ backgroundColor: color }}
                      className="flex items-center gap-1 shadow-md rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap text-white"
                  >
                      <Gauge className="w-3 h-3" />
                      <span>{speed.toFixed(0)}</span>
                  </div>
              </div>
          )}
          <VehiclePin
              vehicle={vehicle}
              isSelected={isSelected} 
              isHistory={isPlaybackMarker}
          />
        </motion.div>
      </Marker>

      {showPopup && isSelected && !historyVehicle && !isMobile && (
        <Popup
            latitude={animatedPosition.lat}
            longitude={animatedPosition.lng}
            offset={isSelected ? 40 : 25}
            closeButton={false}
            onClose={() => dispatch({ type: 'PAN_TO_VEHICLE', payload: null })}
            anchor="bottom"
            maxWidth="300px"
            className="z-[1001] shadow-2xl"
        >
            <VehicleMapPopupContent vehicle={vehicle} />
        </Popup>
      )}

      {contextMenuOpen && !isMobile && (
        <VehicleContextMenu
          vehicle={vehicle}
          position={contextMenuPosition}
          onClose={closeContextMenu}
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
