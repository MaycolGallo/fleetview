
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
}

interface ViewportPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const PADDING_STANDARD: ViewportPadding = { top: 80, bottom: 80, left: 80, right: 80 };
const PADDING_ROUTE: ViewportPadding = { top: 80, bottom: 280, left: 80, right: 80 }; // Tactical clearance for bottom drawer

/**
 * Unified Viewport Engine.
 * Optimized with switch statements and early returns for tactical clarity.
 */
export function useMapViewport({
  map,
  provider,
  isMainMap,
  side,
  miniMapId,
  manualVehicleIds
}: UseMapViewportProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();

  const {
    mapViewport,
    focusedMiniMapId,
    miniMaps,
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

    switch (action.type) {
      case 'pan_to_vehicle':
        if (isMainMap) performPan(map, provider, action.payload, 16);
        break;
      case 'fit_bounds':
        performFitBounds(map, provider, action.payload, PADDING_STANDARD);
        break;
      case 'fit_route':
        performFitBounds(map, provider, action.payload, PADDING_ROUTE);
        break;
    }
    
    dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' });
  }, [map, mapViewport.type, provider, isMainMap, dispatch]);

  // LAYOUT EFFECT: Handle persistent framing and container resizing
  useEffect(() => {
    if (!map) return;

    // Trigger staggered resize bursts to capture final dimensions during transitions
    triggerResize();
    const t1 = setTimeout(triggerResize, 50);
    const t2 = setTimeout(triggerResize, 350);
    const t3 = setTimeout(triggerResize, 750);

    const cleanup = () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
    };

    // PRIORITY 1: Manual Investigation Lock (Do not auto-refit if dispatcher is investigating)
    if (isIncidenciasSheetOpen || historyVehicle) {
      return cleanup;
    }

    // PRIORITY 2: Targeted Framing (Manual > Specific MiniMap > Focus Mode)
    let targetIds: number[] = [];
    
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
        performPan(map, provider, targetPoints[0], 16);
      } else if (targetPoints.length > 1) {
        performFitBounds(map, provider, targetPoints, PADDING_STANDARD);
      }
      return cleanup;
    } 

    // PRIORITY 3: Tactical Baseline (Split View IDA/VUELTA)
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
    despachoBaseRoute
  ]);
}

function performPan(map: MapInstance, provider: MapProvider, point: { lat: number, lng: number }, zoom: number) {
  if (!map) return;
  
  switch (provider) {
    case 'google':
      if (map instanceof google.maps.Map) {
        map.panTo(point);
        if (map.getZoom()! < zoom) map.setZoom(zoom);
      }
      break;
    case 'leaflet':
      if ('setView' in map) {
        (map as L.Map).setView([point.lat, point.lng], zoom, { animate: true });
      }
      break;
    case 'mapbox':
      if ('flyTo' in map) {
        (map as MapRef).flyTo({ center: [point.lng, point.lat], zoom, duration: 800 });
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
        // Leaflet asymmetrical padding support
        (map as L.Map).fitBounds(bounds, { 
            paddingTopLeft: [padding.left, padding.top], 
            paddingBottomRight: [padding.right, padding.bottom],
            animate: true
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
        
        (map as MapRef).fitBounds(bounds, { padding });
      }
      break;
  }
}
