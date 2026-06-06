
'use client';

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { VehiclePin } from '@/components/vehicle/vehicle-pin';
import React from 'react';
import { Gauge } from 'lucide-react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { useAnimatedPosition } from '@/hooks/use-animated-position';
import { VehicleContextMenu } from '@/components/vehicle/vehicle-context-menu';
import { VehicleMobileContextMenu } from '@/components/vehicle/vehicle-mobile-context-menu';
import { useVehicleMarkerInteraction } from '@/hooks/use-vehicle-marker-interaction';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';
import { VehicleMapPopupContent } from './vehicle-map-popup-content';

interface AnimatedVehicleMarkerProps {
    vehicle: Vehicle;
    index?: number;
    showPopup?: boolean;
}

function AnimatedVehicleMarkerComponent({ vehicle, index = 0, showPopup = false }: AnimatedVehicleMarkerProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { selectedVehicle, isRoutePlaying, historyVehicle, playbackAnimationDuration } = state;
  const isSelected = selectedVehicle?.id_vehiculo === vehicle.id_vehiculo;
  const isMobile = useIsMobile();

  // Anchor Ref for perfect InfoWindow positioning via native anchor
  const [markerRef, marker] = useAdvancedMarkerRef();

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

  const color = vehicle.statusColor || '#9E9E9E';
  const speed = parseFloat(vehicle.velocidad) || 0;
  
  const zIndex = isPlaybackMarker ? 50 : (isSelected ? 1000 : 1 + index);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={animatedPosition}
        onClick={handleLeftClick}
        zIndex={zIndex}
      >
        <motion.div
            initial={{ y: -40, opacity: 0, scale: 0.5 }}
            animate={{ 
                y: 0, 
                opacity: 1, 
                scale: isSelected ? 1.25 : 1,
            }}
            transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: isPlaybackMarker ? 0 : (index % 10) * 0.05 
            }}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            className="relative cursor-pointer flex justify-center items-center"
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
      </AdvancedMarker>

      {/* InfoWindow: Using native anchor + high clearance pixelOffset */}
      {showPopup && isSelected && !historyVehicle && !isMobile && (
        <InfoWindow
            anchor={marker}
            onCloseClick={() => dispatch({ type: 'PAN_TO_VEHICLE', payload: null })}
            headerDisabled={true}
            pixelOffset={[0, -100] as any}
        >
            <VehicleMapPopupContent vehicle={vehicle} />
        </InfoWindow>
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

export const AnimatedVehicleMarker = React.memo(AnimatedVehicleMarkerComponent);
