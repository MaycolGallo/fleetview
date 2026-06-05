
'use client';

import { useEffect } from 'react';
import type { FleetState } from '@/lib/types';
import type { FleetAction } from '@/context/fleet-reducer';

interface UseMapViewportProps {
  map: google.maps.Map | null;
  state: FleetState;
  dispatch: React.Dispatch<FleetAction>;
  isMainMap?: boolean;
  side?: 'ida' | 'vuelta';
  miniMapId?: string;
  manualVehicleIds?: number[];
}

/**
 * Custom hook to handle map viewport synchronization (pan, zoom, fitBounds).
 * Encapsulates logic for Focus Mode, Split View, and Radar Tracking.
 */
export function useMapViewport({
  map,
  state,
  dispatch,
  isMainMap,
  side,
  miniMapId,
  manualVehicleIds
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

    // 1. Determine the set of vehicles this map instance is tracking
    let targetVehicleIds: number[] = [];
    
    if (manualVehicleIds) {
      targetVehicleIds = manualVehicleIds;
    } else if (miniMapId) {
      targetVehicleIds = miniMaps.find(m => m.id === miniMapId)?.vehicleIds || [];
    } else if (isMainMap && focusedMiniMapId) {
      targetVehicleIds = miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds || [];
    }

    // 2. If tracking specific units, keep them in view
    if (targetVehicleIds.length > 0) {
      const trackedUnits = vehicles.filter(v => targetVehicleIds.includes(v.id_vehiculo));
      if (trackedUnits.length === 1) {
        const v = trackedUnits[0];
        map.panTo({ lat: v.lat, lng: v.lng });
        if (map.getZoom()! < 16) map.setZoom(16);
      } else if (trackedUnits.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        trackedUnits.forEach(v => bounds.extend({ lat: v.lat, lng: v.lng }));
        map.fitBounds(bounds, 50);
      }
      return;
    }

    // 3. Handle default Viewport Actions (State-driven)
    if (mapViewport.type === 'idle' || mapViewport.type === 'initial') {
      // Fit bounds to Master Route in Split View
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

    // 4. Explicit Viewport Mutations
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
              if (map.getZoom()! < 15) map.setZoom(15);
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
      console.warn('Map viewport update failed', e);
    }
    
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
    miniMapId,
    manualVehicleIds,
    vehicles, 
    focusedMiniMapId, 
    isMainMap, 
    miniMaps
  ]);
}
