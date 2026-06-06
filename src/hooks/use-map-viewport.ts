'use client';

import { useEffect, useMemo, useCallback, useRef } from 'react';
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

/**
 * Unified Viewport Hook: Handles framing, panning, and tactical resize logic.
 * Optimized to prevent "grey area" flickers by decoupling layout triggers from telemetry data.
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
  const lastViewportType = useRef<string | null>(null);

  const {
    mapViewport,
    focusedMiniMapId,
    miniMaps,
    vehicles,
    isSplitView,
    splitDirection,
    historyVehicle,
    isIncidenciasSheetOpen,
    despachoBaseRoute,
    selectedVehicle
  } = state;

  /**
   * Tactical Resize Management.
   * Ensures tiles are loaded and layout is recalculated when container visibility toggles.
   */
  const triggerResize = useCallback(() => {
    if (!map) return;
    if (provider === 'leaflet' && 'invalidateSize' in map) {
      (map as L.Map).invalidateSize({ animate: false, noMove: true });
    } else if (provider === 'mapbox' && 'resize' in map) {
      (map as MapRef).resize();
    } else if (provider === 'google' && typeof google !== 'undefined' && map instanceof google.maps.Map) {
      google.maps.event.trigger(map, 'resize');
    }
  }, [map, provider]);

  // Handle Explicit Viewport Actions (Pan to Vehicle, Fit Route)
  useEffect(() => {
    if (!map || mapViewport.type === 'idle' || mapViewport.type === 'initial') return;

    if (mapViewport.type === 'pan_to_vehicle' && isMainMap) {
      performPan(map, provider, mapViewport.payload, 16);
    } else if ((mapViewport.type === 'fit_bounds' || mapViewport.type === 'fit_route') && mapViewport.payload.length > 0) {
      performFitBounds(map, provider, mapViewport.payload, 100);
    }
    
    dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' });
  }, [map, mapViewport.type, provider, isMainMap, dispatch]);

  // Handle Tactical Layout Changes (Split View, Mini-maps, History)
  // Decoupled from live 'vehicles' array to prevent constant re-rendering
  useEffect(() => {
    if (!map) return;

    // Execute resize cycles to capture layout changes
    triggerResize();
    const t1 = setTimeout(triggerResize, 100);
    const t2 = setTimeout(triggerResize, 600);

    // Mini-Map / Radar Lock Framing
    let targetVehicleIds: number[] = [];
    if (manualVehicleIds) targetVehicleIds = manualVehicleIds;
    else if (miniMapId) targetVehicleIds = miniMaps.find(m => m.id === miniMapId)?.vehicleIds || [];
    else if (isMainMap && focusedMiniMapId) targetVehicleIds = miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds || [];

    if (targetVehicleIds.length > 0 && !isIncidenciasSheetOpen && !historyVehicle) {
      const trackedUnits = vehicles.filter(v => targetVehicleIds.includes(v.id_vehiculo));
      const points = trackedUnits.map(v => ({ lat: v.lat, lng: v.lng }));
      
      if (points.length === 1) {
        performPan(map, provider, points[0], 16);
      } else if (points.length > 1) {
        performFitBounds(map, provider, points, 50);
      }
    } 
    // Default Operational Framing (Split View / Baselines)
    else if (isSplitView && !historyVehicle && !isIncidenciasSheetOpen && despachoBaseRoute.length > 0) {
      const halfIndex = Math.ceil(despachoBaseRoute.length / 2);
      const points = side === 'ida' ? despachoBaseRoute.slice(0, halfIndex) : despachoBaseRoute.slice(halfIndex - 1);
      performFitBounds(map, provider, points, 50);
    }

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [
    map, 
    provider, 
    isMainMap, 
    side, 
    miniMapId, 
    isSplitView, 
    splitDirection, 
    focusedMiniMapId, 
    !!historyVehicle, 
    isIncidenciasSheetOpen,
    triggerResize
    // Note: We deliberately exclude 'vehicles' and 'state' to prevent data-driven flickering
  ]);
}

function performPan(map: MapInstance, provider: MapProvider, point: { lat: number, lng: number }, zoom: number) {
  if (!map) return;
  if (provider === 'google' && map instanceof google.maps.Map) {
    map.panTo(point);
    if (map.getZoom()! < zoom) map.setZoom(zoom);
  } else if (provider === 'leaflet' && 'setView' in map) {
    (map as L.Map).setView([point.lat, point.lng], zoom, { animate: true });
  } else if (provider === 'mapbox' && 'flyTo' in map) {
    (map as MapRef).flyTo({ center: [point.lng, point.lat], zoom, duration: 800 });
  }
}

function performFitBounds(map: MapInstance, provider: MapProvider, points: { lat: number, lng: number }[], padding: number) {
  if (!map || points.length === 0) return;
  if (provider === 'google' && map instanceof google.maps.Map) {
    const bounds = new google.maps.LatLngBounds();
    points.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, padding);
  } else if (provider === 'leaflet' && 'fitBounds' in map) {
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    if ((map as L.Map).getContainer().clientWidth > 0) {
      (map as L.Map).fitBounds(bounds, { padding: [padding, padding] });
    }
  } else if (provider === 'mapbox' && 'fitBounds' in map) {
    const initialLng = points[0].lng;
    const initialLat = points[0].lat;
    const bounds: [[number, number], [number, number]] = points.reduce((acc, p) => {
      return [
        [Math.min(acc[0][0], p.lng), Math.min(acc[0][1], p.lat)],
        [Math.max(acc[1][0], p.lng), Math.max(acc[1][1], p.lat)]
      ] as [[number, number], [number, number]];
    }, [[initialLng, initialLat], [initialLng, initialLat]] as [[number, number], [number, number]]);
    (map as MapRef).fitBounds(bounds, { padding });
  }
}