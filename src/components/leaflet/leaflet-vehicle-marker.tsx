
'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Vehicle } from '@/lib/types';
import { useAnimatedPosition } from '@/hooks/use-animated-position';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { renderToStaticMarkup } from 'react-dom/server';
import { VehiclePin } from '@/components/vehicle/vehicle-pin';
import { Gauge } from 'lucide-react';
import { useVehicleMarkerInteraction } from '@/hooks/use-vehicle-marker-interaction';
import { useIsMobile } from '@/hooks/use-mobile';
import { VehicleContextMenu } from '@/components/vehicle/vehicle-context-menu';
import { VehicleMobileContextMenu } from '@/components/vehicle/vehicle-mobile-context-menu';
import { VehicleMapPopupContent } from '../vehicle/vehicle-map-popup-content';

interface LeafletVehicleMarkerProps {
  vehicle: Vehicle;
  index?: number;
  showPopup?: boolean;
}

export function LeafletVehicleMarker({ vehicle, index = 0, showPopup = false }: LeafletVehicleMarkerProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const markerRef = useRef<L.Marker>(null);
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

  const icon = useMemo(() => {
    return L.divIcon({
      className: 'leaflet-vehicle-marker-container',
      html: renderToStaticMarkup(
        <div className="vehicle-marker-inner relative flex flex-col items-center justify-center">
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
        </div>
      ),
      iconSize: isPlaybackMarker ? [24, 24] : [40, 56],
      iconAnchor: isPlaybackMarker ? [12, 12] : [20, 56],
    });
  }, [vehicle.id_vehiculo, vehicle.rumbo, vehicle.statusColor, isPlaybackMarker, speed, color]);

  // Handle selection lifecycle to ensure Popup opens on first click
  useEffect(() => {
    if (isSelected && markerRef.current && showPopup && !isMobile) {
      const marker = markerRef.current;
      // We use a tiny timeout to allow React-Leaflet to mount the Popup component
      // into the Leaflet instance before calling the native openPopup method.
      const timer = setTimeout(() => {
        if (!marker.isPopupOpen()) {
          marker.openPopup();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSelected, showPopup, isMobile]);

  const handleMarkerClick = (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    handleLeftClick(e.originalEvent);
  };

  const handleMarkerContextMenu = (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    handleContextMenu(e.originalEvent as any);
  };

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const element = marker.getElement();
    if (!element) return;

    if (isSelected) {
      element.classList.add('leaflet-marker-selected');
      marker.setZIndexOffset(1000);
    } else {
      element.classList.remove('leaflet-marker-selected');
      marker.setZIndexOffset(index);
    }

    element.addEventListener('touchstart', handleTouchStart as any, { passive: true });
    element.addEventListener('touchend', handleTouchEnd as any, { passive: true });
    element.addEventListener('touchmove', handleTouchMove as any, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as any);
      element.removeEventListener('touchend', handleTouchEnd as any);
      element.removeEventListener('touchmove', handleTouchMove as any);
    };
  }, [isSelected, index, handleTouchStart, handleTouchEnd, handleTouchMove]);

  return (
    <>
      <Marker 
        ref={markerRef}
        position={[animatedPosition.lat, animatedPosition.lng]} 
        icon={icon}
        eventHandlers={{
          click: handleMarkerClick,
          contextmenu: handleMarkerContextMenu
        }}
      >
        <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
          <div className="font-bold text-xs uppercase tracking-wider">{vehicle.placa}</div>
        </Tooltip>
        
        {showPopup && isSelected && !historyVehicle && !isMobile && (
          <Popup offset={[0, -50]} closeButton={false}>
            <VehicleMapPopupContent vehicle={vehicle} />
          </Popup>
        )}
      </Marker>

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
