
'use client';

import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from '@/components/vehicle/vehicle-pin';
import React from 'react';
import { Gauge } from 'lucide-react';
import { useFleetState } from '@/context/fleet-context';
import { useAnimatedPosition } from '@/hooks/use-animated-position';
import { VehicleContextMenu } from '@/components/vehicle/vehicle-context-menu';
import { VehicleMobileContextMenu } from '@/components/vehicle/vehicle-mobile-context-menu';
import { useVehicleMarkerInteraction } from '@/hooks/use-vehicle-marker-interaction';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

function AnimatedVehicleMarkerComponent({ vehicle, index = 0 }: { vehicle: Vehicle; index?: number }) {
  const { state } = useFleetState();
  const { selectedVehicle, isRoutePlaying, historyVehicle, playbackAnimationDuration } = state;
  const isSelected = selectedVehicle?.id_vehiculo === vehicle.id_vehiculo;
  const isMobile = useIsMobile();

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
        key={vehicle.id_vehiculo}
        position={animatedPosition}
        onClick={handleLeftClick}
        zIndex={zIndex}
      >
        <motion.div
            layout
            initial={{ y: -60, opacity: 0, scale: 0.3 }}
            animate={{ 
                y: 0, 
                opacity: 1, 
                scale: isSelected ? 1.25 : 1,
            }}
            transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20, 
                delay: isPlaybackMarker ? 0 : (index % 20) * 0.03 
            }}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            data-vehicle-id={vehicle.id_vehiculo}
            className={cn("relative cursor-pointer flex justify-center items-center")}
        >
            {speed > 0 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ backgroundColor: color }}
                        className="flex items-center gap-1 shadow-md rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap text-white"
                    >
                        <Gauge className="w-3 h-3" />
                        <span>{speed.toFixed(0)}</span>
                    </motion.div>
                </div>
            )}

          <VehiclePin
            vehicle={vehicle}
            isSelected={isSelected}
            isHistory={isPlaybackMarker}
          />
        </motion.div>
      </AdvancedMarker>

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
