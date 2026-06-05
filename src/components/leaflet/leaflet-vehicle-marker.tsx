
'use client';

import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { Vehicle } from '@/lib/types';
import { useAnimatedPosition } from '@/hooks/use-animated-position';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { useVehicleMarkerInteraction } from '@/hooks/use-vehicle-marker-interaction';
import { renderToStaticMarkup } from 'react-dom/server';
import { Car, Gauge } from 'lucide-react';
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

  const { handleLeftClick } = useVehicleMarkerInteraction({ vehicle });

  const isPlaybackMarker = !!historyVehicle;
  const targetPosition = { lat: vehicle.lat, lng: vehicle.lng };
  
  const animationDuration = (isPlaybackMarker && isRoutePlaying) ? playbackAnimationDuration : 1000;
  const animatedPosition = useAnimatedPosition(targetPosition, { duration: animationDuration });

  const color = vehicle.statusColor || '#9E9E9E';
  const speed = parseFloat(vehicle.velocidad) || 0;

  // Create custom DivIcon for Leaflet to match our Google Maps pin style
  const icon = L.divIcon({
    className: 'custom-vehicle-icon',
    html: renderToStaticMarkup(
      <div className={cn("relative flex items-center justify-center transition-all duration-300", isSelected ? "scale-125" : "scale-100")}>
        {speed > 0 && (
          <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-md px-1.5 py-0.5 rounded shadow-sm border border-primary/20 text-[8px] font-bold flex items-center gap-1">
             <Gauge className="w-2 h-2 text-primary" /> {speed.toFixed(0)}
          </div>
        )}
        <div 
          className={cn(
            "w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white",
            isPlaybackMarker ? "ring-2 ring-primary" : ""
          )}
          style={{ backgroundColor: color }}
        >
           <div style={{ transform: `rotate(${vehicle.rumbo}deg)` }}>
              <Car className="w-4 h-4" />
           </div>
        </div>
      </div>
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <Marker 
      position={[animatedPosition.lat, animatedPosition.lng]} 
      icon={icon}
      eventHandlers={{
        click: () => dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle })
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1}>
        <div className="font-bold text-xs uppercase tracking-wider">{vehicle.placa}</div>
      </Tooltip>
    </Marker>
  );
}
