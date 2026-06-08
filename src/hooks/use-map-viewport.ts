'use client';

import { useEffect, useCallback } from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import type { MapProvider } from '@/lib/types';
import type { MapRef } from 'react-map-gl';
import L from 'leaflet';

/**
 * Unified Map Instance Type
 */
type MapInstance = google.maps.Map | L.Map | MapRef | null | undefined;

interface UseMapViewportProps {
  map: MapInstance;
  provider: MapProvider;
  isMainMap?: boolean;
  side?: 'ida' | 'vuelta';
  miniMapId?: string;
  manualVehicleIds?: number[];
  isVisible?: boolean;
}

interface ViewportPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const PADDING_STANDARD: ViewportPadding = { top: 80, bottom: 80, left: 80, right: 80 };
const PADDING_ROUTE: ViewportPadding = { top: 80, bottom: 280, left: 80, right: 80 }; // Tactical clearance for bottom drawer
const PADDING_WITH_GRID: ViewportPadding = { top: 80, bottom: 80, left: 80, right: 440 }; // Tactical clearance for radar grid

/**
 * Unified Viewport Engine.
 * Optimized with Targeted Navigation and Asymmetrical Padding.
 */
export function useMapViewport({
  map,
  provider,
  isMainMap,
  side,
  miniMapId,
  manualVehicleIds,
  isVisible = true
}: UseMapViewportProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();

  const {
    mapViewport,
    focusedMiniMapId,
    miniMaps,
    visibleMiniMapIds,
    vehicles,
    isSplitView,
    historyVehicle,
    isIncidenciasSheetOpen,
    despachoBaseRoute,
    selectedVehicle
  } = state;

  /**
   * Tactical Resize Burst Management.
   */
  const triggerResize = useCallback(() => {
    if (!map) return;
    
    switch (provider) {
      case 'leaflet':
        if ('invalidateSize' in map) (map as L.Map).invalidateSize({ animate: false, noMove: true });
        break;
      case 'mapbox':
        if ('resize' in map) (map as MapRef).resize();
        break;
      case 'google':
        if (typeof google !== 'undefined' && map instanceof google.maps.Map) google.maps.event.trigger(map, 'resize');
        break;
    }
  }, [map, provider]);

  // ACTION EFFECT: Handle explicit navigation commands (Pan/Fit)
  useEffect(() => {
    if (!map || mapViewport.type === 'idle' || mapViewport.type === 'initial') return;

    const action = mapViewport;
    const isGridVisible = isMainMap && visibleMiniMapIds.length > 0;
    const currentPadding = isGridVisible ? PADDING_WITH_GRID : PADDING_STANDARD;

    switch (action.type) {
      case 'pan_to_vehicle': {
        const targetVehicleId = action.vehicleId;
        let shouldRespond = false;

        if (isMainMap) {
          if (focusedMiniMapId) {
            const group = miniMaps.find(m => m.id === focusedMiniMapId);
            shouldRespond = group?.vehicleIds.includes(targetVehicleId) ?? false;
          } else {
            const overlayVehicleIds = miniMaps
              .filter(m => visibleMiniMapIds.includes(m.id))
              .flatMap(m => m.vehicleIds);
            
            shouldRespond = !overlayVehicleIds.includes(targetVehicleId);
          }
        } else {
          shouldRespond = false;
        }

        if (shouldRespond) performPan(map, provider, action.payload, 16, currentPadding);
        break;
      }
      case 'fit_bounds':
        performFitBounds(map, provider, action.payload, currentPadding);
        break;
      case 'fit_route':
        performFitBounds(map, provider, action.payload, PADDING_ROUTE);
        break;
    }
    
    dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' });
  }, [map, mapViewport, provider, isMainMap, miniMapId, focusedMiniMapId, visibleMiniMapIds, miniMaps, dispatch]);

  // LAYOUT EFFECT: Handle persistent framing and container resizing
  useEffect(() => {
    if (!map) return;

    triggerResize();
    const t1 = setTimeout(triggerResize, 50);
    const t2 = setTimeout(triggerResize, 350);
    const t3 = setTimeout(triggerResize, 750);

    const cleanup = () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
    };

    if (!isVisible) return cleanup;

    if (isIncidenciasSheetOpen || historyVehicle) {
      return cleanup;
    }

    let targetIds: number[] = [];
    const isGridVisible = isMainMap && visibleMiniMapIds.length > 0;
    const currentPadding = isGridVisible ? PADDING_WITH_GRID : PADDING_STANDARD;
    
    if (manualVehicleIds) {
      targetIds = manualVehicleIds;
    } else if (miniMapId) {
      targetIds = miniMaps.find(m => m.id === miniMapId)?.vehicleIds || [];
    } else if (isMainMap && focusedMiniMapId && !selectedVehicle) {
      targetIds = miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds || [];
    }

    if (targetIds.length > 0) {
      const targetPoints = vehicles
        .filter(v => targetIds.includes(v.id_vehiculo))
        .map(v => ({ lat: v.lat, lng: v.lng }));
      
      if (targetPoints.length === 1) {
        performPan(map, provider, targetPoints[0], 16, currentPadding);
      } else if (targetPoints.length > 1) {
        performFitBounds(map, provider, targetPoints, currentPadding);
      }
      return cleanup;
    } 

    if (isSplitView && !selectedVehicle && despachoBaseRoute.length > 0) {
      const half = Math.ceil(despachoBaseRoute.length / 2);
      const baselinePoints = side === 'ida' 
        ? despachoBaseRoute.slice(0, half) 
        : despachoBaseRoute.slice(half - 1);
        
      performFitBounds(map, provider, baselinePoints, PADDING_STANDARD);
    }

    return cleanup;
  }, [
    map, 
    provider, 
    isMainMap, 
    side, 
    miniMapId, 
    isSplitView, 
    focusedMiniMapId, 
    !!historyVehicle, 
    isIncidenciasSheetOpen,
    triggerResize,
    selectedVehicle,
    vehicles,
    miniMaps,
    visibleMiniMapIds,
    despachoBaseRoute,
    isVisible
  ]);
}

/**
 * performPan: Standard high-precision navigation.
 */
function performPan(map: MapInstance, provider: MapProvider, point: { lat: number, lng: number }, zoom: number, padding: ViewportPadding) {
  if (!map) return;
  
  switch (provider) {
    case 'google':
      if (map instanceof google.maps.Map) {
        map.setZoom(zoom);
        map.panTo(point);
        // Apply lateral shift for Google if high right padding (radar grid) is active
        if (padding.right > 80) {
           // pans the map content to the right, effectively moving the center point to the left half of the screen
           map.panBy((padding.right - 80) / 2, 0);
        }
      }
      break;
    case 'leaflet':
      if ('setView' in map) {
        (map as L.Map).setView([point.lat, point.lng], zoom, { animate: true });
      }
      break;
    case 'mapbox':
      if ('flyTo' in map) {
        (map as MapRef).flyTo({ center: [point.lng, point.lat], zoom, duration: 800, padding });
      }
      break;
  }
}

function performFitBounds(map: MapInstance, provider: MapProvider, points: { lat: number, lng: number }[], padding: ViewportPadding) {
  if (!map || points.length === 0) return;

  switch (provider) {
    case 'google':
      if (map instanceof google.maps.Map) {
        const bounds = new google.maps.LatLngBounds();
        points.forEach(p => bounds.extend(p));
        map.fitBounds(bounds, padding);
      }
      break;
    case 'leaflet':
      if ('fitBounds' in map) {
        const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
        (map as L.Map).fitBounds(bounds, { 
            paddingTopLeft: [padding.left, padding.top], 
            paddingBottomRight: [padding.right, padding.bottom],
            animate: true,
            maxZoom: 16
        });
      }
      break;
    case 'mapbox':
      if ('fitBounds' in map) {
        const initial = points[0];
        const bounds: [[number, number], [number, number]] = points.reduce((acc, p) => [
          [Math.min(acc[0][0], p.lng), Math.min(acc[0][1], p.lat)],
          [Math.max(acc[1][0], p.lng), Math.max(acc[1][1], p.lat)]
        ] as [[number, number], [number, number]], [[initial.lng, initial.lat], [initial.lng, initial.lat]] as [[number, number], [number, number]]);
        
        (map as MapRef).fitBounds(bounds, { padding, maxZoom: 16 });
      }
      break;
  }
}
