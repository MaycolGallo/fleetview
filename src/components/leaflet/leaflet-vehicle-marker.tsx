
'use client';

import React, { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { Vehicle } from '@/lib/types';
import { useAnimatedPosition } from '@/hooks/use-animated-position';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { renderToStaticMarkup } from 'react-dom/server';
import { VehiclePin } from '@/components/vehicle/vehicle-pin';
import { Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeafletVehicleMarkerProps {
  vehicle: Vehicle;
  index?: number;
}

export function LeafletVehicleMarker({ vehicle, index = 0 }: LeafletVehicleMarkerProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { selectedVehicle, isRoutePlaying, historyVehicle, playbackAnimationDuration } = state;
  const isSelected = selectedVehicle?.id_vehiculo === vehicle.id_vehiculo;

  const isPlaybackMarker = !!historyVehicle;
  const targetPosition = { lat: vehicle.lat, lng: vehicle.lng };
  
  const animationDuration = (isPlaybackMarker && isRoutePlaying) ? playbackAnimationDuration : 1000;
  const animatedPosition = useAnimatedPosition(targetPosition, { duration: animationDuration });

  const speed = parseFloat(vehicle.velocidad) || 0;
  const color = vehicle.statusColor || '#9E9E9E';

  // Use useMemo to generate the icon to mirror Google Maps visual exactly
  const icon = useMemo(() => {
    return L.divIcon({
      className: 'custom-vehicle-icon',
      html: renderToStaticMarkup(
        <div className={cn("relative flex flex-col items-center justify-center", isSelected ? "z-50" : "z-0")}>
          {speed > 0 && !isPlaybackMarker && (
              <div className="absolute top-[-10px] z-10">
                  <div
                      style={{ backgroundColor: color }}
                      className="flex items-center gap-1 shadow-md rounded-md px-2 py-1 text-[10px] font-bold whitespace-nowrap text-white"
                  >
                      <Gauge className="w-2.5 h-2.5" />
                      <span>{speed.toFixed(0)}</span>
                  </div>
              </div>
          )}
          <div className={cn("transition-transform duration-300", isSelected ? "scale-125" : "scale-100")}>
            <VehiclePin
                vehicle={vehicle}
                isSelected={isSelected}
                isHistory={isPlaybackMarker}
            />
          </div>
        </div>
      ),
      // Standard pin is roughly 40x56, Anchor near bottom tip (20, 48)
      iconSize: isPlaybackMarker ? [24, 24] : [40, 56],
      iconAnchor: isPlaybackMarker ? [12, 12] : [20, 48],
    });
  }, [vehicle.rumbo, vehicle.statusColor, vehicle.placa, isSelected, isPlaybackMarker, speed, color]);

  return (
    <Marker 
      position={[animatedPosition.lat, animatedPosition.lng]} 
      icon={icon}
      eventHandlers={{
        click: () => dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle })
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
        <div className="font-bold text-xs uppercase tracking-wider">{vehicle.placa}</div>
      </Tooltip>
    </Marker>
  );
}
