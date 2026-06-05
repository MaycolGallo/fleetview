
'use client';

import React, { useMemo, useRef, useEffect } from 'react';
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
  const markerRef = useRef<L.Marker>(null);
  
  const { selectedVehicle, isRoutePlaying, historyVehicle, playbackAnimationDuration } = state;
  const isSelected = selectedVehicle?.id_vehiculo === vehicle.id_vehiculo;

  const isPlaybackMarker = !!historyVehicle;
  const targetPosition = { lat: vehicle.lat, lng: vehicle.lng };
  
  const animationDuration = (isPlaybackMarker && isRoutePlaying) ? playbackAnimationDuration : 1000;
  const animatedPosition = useAnimatedPosition(targetPosition, { duration: animationDuration });

  const speed = parseFloat(vehicle.velocidad) || 0;
  const color = vehicle.statusColor || '#9E9E9E';

  // We use a STABLE icon that doesn't depend on 'isSelected'.
  // This prevents the entire marker DOM from being replaced when clicked, 
  // which is what causes the "blink" and resets animations.
  const icon = useMemo(() => {
    return L.divIcon({
      className: 'custom-vehicle-marker-wrapper animate-marker-drop',
      html: renderToStaticMarkup(
        <div className="relative flex flex-col items-center justify-center leaflet-vehicle-icon-inner">
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
              isSelected={false} // Selection handled via CSS class on the container
              isHistory={isPlaybackMarker}
          />
        </div>
      ),
      iconSize: isPlaybackMarker ? [24, 24] : [40, 56],
      iconAnchor: isPlaybackMarker ? [12, 12] : [20, 56],
    });
  }, [vehicle.id_vehiculo, vehicle.rumbo, vehicle.statusColor, isPlaybackMarker]);

  // Handle selection state via DOM manipulation to avoid the "blink"
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const element = marker.getElement();
    if (!element) return;

    // Use setZIndexOffset to move selected markers to front
    if (isSelected) {
      element.classList.add('leaflet-marker-selected');
      marker.setZIndexOffset(1000);
    } else {
      element.classList.remove('leaflet-marker-selected');
      marker.setZIndexOffset(index);
    }
  }, [isSelected, index]);

  return (
    <Marker 
      ref={markerRef}
      position={[animatedPosition.lat, animatedPosition.lng]} 
      icon={icon}
      eventHandlers={{
        click: (e) => {
            L.DomEvent.stopPropagation(e);
            dispatch({ type: 'PAN_TO_VEHICLE', payload: vehicle });
        }
      }}
    >
      <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
        <div className="font-bold text-xs uppercase tracking-wider">{vehicle.placa}</div>
      </Tooltip>
    </Marker>
  );
}
