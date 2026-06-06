'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useFleetState, useFleetDispatch, selectMapVehicles } from '@/context/fleet-context';
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
    splitDirection,
    historyVehicle,
    isIncidenciasSheetOpen,
    despachoBaseRoute,
    selectedVehicle,
    activePanel
  } = state;

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, miniMapId, manualVehicleIds, isMainMap), 
    [state, miniMapId, manualVehicleIds, isMainMap]
  );

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
    } else if (provider === 'google' && typeof google !== 'undefined') {
      google.maps.event.trigger(map, 'resize');
    }
  }, [map, provider]);

  useEffect(() => {
    if (!map) return;

    // Execute multiple resize cycles to capture settling animations/layout changes
    triggerResize();
    const t1 = setTimeout(triggerResize, 100);
    const t2 = setTimeout(triggerResize, 500);

    // 2. Explicit Viewport Mutations (Pan to Vehicle, Fit Route, etc.)
    if (mapViewport.type !== 'idle' && mapViewport.type !== 'initial') {
      switch (mapViewport.type) {
        case 'pan_to_vehicle':
          // The Main Map always honors explicit pans even if unit is isolated in mini-map
          if (isMainMap) {
              performPan(map, provider, mapViewport.payload, 16);
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
      return () => { clearTimeout(t1); clearTimeout(t2); }; 
    }

    // 3. Mini-Map / Radar Lock Framing
    let targetVehicleIds: number[] = [];
    if (manualVehicleIds) targetVehicleIds = manualVehicleIds;
    else if (miniMapId) targetVehicleIds = miniMaps.find(m => m.id === miniMapId)?.vehicleIds || [];
    else if (isMainMap && focusedMiniMapId) targetVehicleIds = miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds || [];

    if (targetVehicleIds.length > 0 && !isIncidenciasSheetOpen && !historyVehicle) {
      const trackedUnits = vehicles.filter(v => targetVehicleIds.includes(v.id_vehiculo));
      const points = trackedUnits.map(v => ({ lat: v.lat, lng: v.lng }));
      
      const selectedTrackedUnit = selectedVehicle && targetVehicleIds.includes(selectedVehicle.id_vehiculo) 
        ? vehicles.find(v => v.id_vehiculo === selectedVehicle.id_vehiculo)
        : null;

      if (selectedTrackedUnit && isMainMap) {
        performPan(map, provider, { lat: selectedTrackedUnit.lat, lng: selectedTrackedUnit.lng }, 16);
      } else if (points.length === 1) {
        performPan(map, provider, points[0], 16);
      } else if (points.length > 1) {
        performFitBounds(map, provider, points, 50);
      }
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    // 4. Default Viewport Framing (Split View / Operational Baselines)
    if (mapViewport.type === 'idle' || mapViewport.type === 'initial') {
      if (isSplitView && !historyVehicle && !isIncidenciasSheetOpen && despachoBaseRoute.length > 0) {
        const halfIndex = Math.ceil(despachoBaseRoute.length / 2);
        const points = side === 'ida' ? despachoBaseRoute.slice(0, halfIndex) : despachoBaseRoute.slice(halfIndex - 1);
        performFitBounds(map, provider, points, 50);
      }
    }

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map, mapViewport, provider, state, dispatch, isMainMap, side, miniMapId, manualVehicleIds, mapVehicles, selectedVehicle, isSplitView, splitDirection, isIncidenciasSheetOpen, historyVehicle, activePanel, triggerResize]);
}

/**
 * Native Panning Wrappers
 */
function performPan(map: MapInstance, provider: MapProvider, point: { lat: number, lng: number }, zoom: number) {
  if (!map) return;

  if (provider === 'google' && 'panTo' in map) {
    (map as google.maps.Map).panTo(point);
    if ((map as google.maps.Map).getZoom()! < zoom) (map as google.maps.Map).setZoom(zoom);
  } else if (provider === 'leaflet' && 'setView' in map) {
    (map as L.Map).setView([point.lat, point.lng], zoom, { animate: true });
  } else if (provider === 'mapbox' && 'flyTo' in map) {
    (map as MapRef).flyTo({ center: [point.lng, point.lat], zoom, duration: 800 });
  }
}

/**
 * Native FitBounds Wrappers
 */
function performFitBounds(map: MapInstance, provider: MapProvider, points: { lat: number, lng: number }[], padding: number) {
  if (!map || points.length === 0) return;

  if (provider === 'google' && 'fitBounds' in map) {
    const bounds = new google.maps.LatLngBounds();
    points.forEach(p => bounds.extend(p));
    (map as google.maps.Map).fitBounds(bounds, padding);
  } else if (provider === 'leaflet' && 'fitBounds' in map) {
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    // Important: only fitBounds if container has size, otherwise Leaflet throws
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