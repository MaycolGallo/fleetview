
'use client';

import { useEffect, useMemo } from 'react';
import { useFleetState, useFleetDispatch, selectMapVehicles } from '@/context/fleet-context';
import type { MapProvider } from '@/lib/types';
import type { MapRef } from 'react-map-gl';
import L from 'leaflet';

/**
 * Unified Map Instance Type
 * Represents the native instances provided by our three tactical engines.
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

/**
 * Unified custom hook to handle map viewport synchronization (pan, zoom, fitBounds).
 * Consumes FleetContext directly to manage tactical movement across Google, Leaflet, and Mapbox.
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
    despachoBaseRoute
  } = state;

  // Determine which vehicles belong to THIS map instance context
  const mapVehicles = useMemo(
    () => selectMapVehicles(state, miniMapId, manualVehicleIds, isMainMap), 
    [state, miniMapId, manualVehicleIds, isMainMap]
  );

  useEffect(() => {
    if (!map) return;

    // 1. Determine high-priority targets for this instance (Radar Lock / Focus Mode)
    let targetVehicleIds: number[] = [];
    if (manualVehicleIds) targetVehicleIds = manualVehicleIds;
    else if (miniMapId) targetVehicleIds = miniMaps.find(m => m.id === miniMapId)?.vehicleIds || [];
    else if (isMainMap && focusedMiniMapId) targetVehicleIds = miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds || [];

    // 2. Continuous Tracking Logic (for small radar windows or focus modes)
    if (targetVehicleIds.length > 0 && !isIncidenciasSheetOpen && !historyVehicle) {
      const trackedUnits = vehicles.filter(v => targetVehicleIds.includes(v.id_vehiculo));
      const points = trackedUnits.map(v => ({ lat: v.lat, lng: v.lng }));
      
      if (trackedUnits.length === 1) {
        performPan(map, provider, points[0], 16);
      } else if (trackedUnits.length > 1) {
        performFitBounds(map, provider, points, 50);
      }
      return;
    }

    // 3. Handle Default Viewport Actions (State-driven initial framing)
    if (mapViewport.type === 'idle' || mapViewport.type === 'initial') {
      if (isSplitView && !historyVehicle && !isIncidenciasSheetOpen && despachoBaseRoute.length > 0) {
        const halfIndex = Math.ceil(despachoBaseRoute.length / 2);
        const points = side === 'ida' ? despachoBaseRoute.slice(0, halfIndex) : despachoBaseRoute.slice(halfIndex - 1);
        performFitBounds(map, provider, points, 50);
      }
      return;
    }

    // 4. Explicit Viewport Mutations (Pan to Vehicle, Fit Route, etc.)
    switch (mapViewport.type) {
      case 'pan_to_vehicle':
        // TACTICAL LOGIC: 
        // - Allow panning if this is an incident (-1) and we are on the main map.
        // - Allow panning if the vehicle is currently relevant to this map's specific view list.
        const isIncident = mapViewport.vehicleId === -1;
        const isVehicleRelevant = mapVehicles.some(v => v.id_vehiculo === mapViewport.vehicleId);

        if ((isIncident && isMainMap) || isVehicleRelevant) {
            performPan(map, provider, mapViewport.payload, 15);
        }
        break;
      case 'fit_bounds':
      case 'fit_route':
        if (mapViewport.payload.length > 0) {
          performFitBounds(map, provider, mapViewport.payload, 100);
        }
        break;
    }

    dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' });

  }, [map, mapViewport, provider, state, dispatch, isMainMap, side, miniMapId, manualVehicleIds, mapVehicles]);
}

/**
 * Native Panning Wrappers with Type Guarding
 */
function performPan(map: MapInstance, provider: MapProvider, point: { lat: number, lng: number }, zoom: number) {
  if (!map) return;

  if (provider === 'google' && 'panTo' in map) {
    (map as google.maps.Map).panTo(point);
    if ((map as google.maps.Map).getZoom()! < zoom) (map as google.maps.Map).setZoom(zoom);
  } else if (provider === 'leaflet' && 'setView' in map) {
    (map as L.Map).setView([point.lat, point.lng], zoom, { animate: true });
  } else if (provider === 'mapbox' && 'flyTo' in map) {
    (map as MapRef).flyTo({ center: [point.lng, point.lat], zoom, duration: 1000 });
  }
}

/**
 * Native FitBounds Wrappers with Type Guarding
 */
function performFitBounds(map: MapInstance, provider: MapProvider, points: { lat: number, lng: number }[], padding: number) {
  if (!map || points.length === 0) return;

  if (provider === 'google' && 'fitBounds' in map) {
    const bounds = new google.maps.LatLngBounds();
    points.forEach(p => bounds.extend(p));
    (map as google.maps.Map).fitBounds(bounds, padding);
  } else if (provider === 'leaflet' && 'fitBounds' in map) {
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    (map as L.Map).fitBounds(bounds, { padding: [padding, padding] });
  } else if (provider === 'mapbox' && 'fitBounds' in map) {
    const initialLng = points[0].lng;
    const initialLat = points[0].lat;
    
    // Explicit tuple casting for LngLatBoundsLike compatibility
    const bounds: [[number, number], [number, number]] = points.reduce((acc, p) => {
      return [
        [Math.min(acc[0][0], p.lng), Math.min(acc[0][1], p.lat)],
        [Math.max(acc[1][0], p.lng), Math.max(acc[1][1], p.lat)]
      ] as [[number, number], [number, number]];
    }, [[initialLng, initialLat], [initialLng, initialLat]] as [[number, number], [number, number]]);
    
    (map as MapRef).fitBounds(bounds, { padding });
  }
}
