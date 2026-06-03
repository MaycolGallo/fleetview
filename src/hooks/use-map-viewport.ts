'use client';

import { useEffect } from 'react';
import type { MapViewport, FleetState } from '@/lib/types';
import type { FleetAction } from '@/context/fleet-reducer';

interface UseMapViewportProps {
  map: google.maps.Map | null;
  state: FleetState;
  dispatch: React.Dispatch<FleetAction>;
  isMainMap?: boolean;
  side?: 'ida' | 'vuelta';
  trackedVehicleIds?: number[];
}

/**
 * Custom hook to handle map viewport synchronization (pan, zoom, fitBounds).
 * Encapsulates complex logic for Focus Mode, Split View, and Route Tracking.
 */
export function useMapViewport({
  map,
  state,
  dispatch,
  isMainMap,
  side,
  trackedVehicleIds
}: UseMapViewportProps) {
  const {
    mapViewport,
    focusedMiniMapId,
    miniMaps,
    vehicles,
    isSplitView,
    historyVehicle,
    isIncidenciasSheetOpen,
    masterRoute
  } = state;

  useEffect(() => {
    if (!map) return;

    // 1. Radar Group Focus or Tracking logic
    const isFocusMain = isMainMap && focusedMiniMapId;
    const trackingIds = isFocusMain 
      ? miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds 
      : trackedVehicleIds;

    if (trackingIds && trackingIds.length > 0) {
      const trackedVehicles = vehicles.filter(v => trackingIds.includes(v.id_vehiculo));
      if (trackedVehicles.length === 1) {
        const v = trackedVehicles[0];
        map.panTo({ lat: v.lat, lng: v.lng });
        if (map.getZoom()! < 16) map.setZoom(16);
      } else if (trackedVehicles.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        trackedVehicles.forEach(v => bounds.extend({ lat: v.lat, lng: v.lng }));
        map.fitBounds(bounds, 50);
      }
      return;
    }

    // 2. Default Initial / Idle Viewports
    if (mapViewport.type === 'idle' || mapViewport.type === 'initial') {
      // Special case: Fit bounds to Master Route in Split View
      if (isSplitView && !historyVehicle && !isIncidenciasSheetOpen && masterRoute.length > 0) {
        try {
          const halfIndex = Math.ceil(masterRoute.length / 2);
          const points = side === 'ida' ? masterRoute.slice(0, halfIndex) : masterRoute.slice(halfIndex - 1);
          const bounds = new google.maps.LatLngBounds();
          points.forEach(p => bounds.extend(p));
          map.fitBounds(bounds, 50);
        } catch (e) {
          console.warn('Could not fit bounds for master route', e);
        }
      }
      return;
    }

    // 3. Explicit Viewport Actions (State-driven)
    try {
      switch (mapViewport.type) {
        case 'pan_to_vehicle': {
          const { lat, lng } = mapViewport.payload;
          map.panTo({ lat: lat, lng: lng });
          if (map.getZoom()! < 15) {
            map.setZoom(15);
          }
          break;
        }
        case 'fit_bounds':
        case 'fit_route': {
          const points = mapViewport.payload;
          if (points && points.length > 0) {
            if (points.length === 1) {
              map.panTo(points[0]);
              if (map.getZoom()! < 15) {
                  map.setZoom(15);
              }
            } else {
              const bounds = new google.maps.LatLngBounds();
              points.forEach(point => bounds.extend(point));
              map.fitBounds(bounds, 100);
            }
          }
          break;
        }
      }
    } catch (e) {
      console.warn('Map interaction failed', e);
    }
    
    // Reset viewport state to 'idle'
    dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' });

  }, [
    map, 
    mapViewport, 
    dispatch, 
    isSplitView, 
    historyVehicle, 
    isIncidenciasSheetOpen, 
    masterRoute, 
    side, 
    trackedVehicleIds, 
    vehicles, 
    focusedMiniMapId, 
    isMainMap, 
    miniMaps
  ]);
}
