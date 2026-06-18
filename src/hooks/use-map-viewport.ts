'use client';

import { useEffect, useCallback } from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import type { MapProvider } from '@/lib/types';
import type { MapRef } from 'react-map-gl';
import L from 'leaflet';

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

// Tactical Padding Constants
const PADDING_STANDARD: ViewportPadding = { top: 80, bottom: 80, left: 80, right: 80 };
const PADDING_ROUTE: ViewportPadding = { top: 80, bottom: 280, left: 80, right: 80 };
const PADDING_WITH_GRID: ViewportPadding = { top: 80, bottom: 80, left: 80, right: 440 };
const PADDING_MINIMAP: ViewportPadding = { top: 20, bottom: 20, left: 20, right: 20 };

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
        if (typeof google !== 'undefined' && map instanceof google.maps.Map) {
          google.maps.event.trigger(map, 'resize');
        }
        break;
    }
  }, [map, provider]);

  // Reactive Logic for Specific Viewport Actions
  useEffect(() => {
    if (!map || mapViewport.type === 'idle' || mapViewport.type === 'initial') return;

    const action = mapViewport;
    // Main map is "Grid Active" if radar maps are visible OR if in Focus Mode (which shows Overview Mini)
    const isGridActive = isMainMap && (visibleMiniMapIds.length > 0 || !!focusedMiniMapId);
    // Use compact padding for minimaps, larger padding for main map
    const currentPadding = !isMainMap ? PADDING_MINIMAP : (isGridActive ? PADDING_WITH_GRID : PADDING_STANDARD);

    switch (action.type) {
      case 'pan_to_vehicle': {
        const targetId = action.vehicleId;
        let shouldPerform = false;

        // Command Rules for targeted panning
        if (isMainMap) {
          if (focusedMiniMapId) {
            // In Focus Mode, main map only pans to units inside the focused radar group
            shouldPerform = miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds.includes(targetId) ?? false;
          } else {
            // Main map only pans to units visible in the main workspace (free units)
            const radarIds = miniMaps.filter(m => visibleMiniMapIds.includes(m.id)).flatMap(m => m.vehicleIds);
            shouldPerform = !radarIds.includes(targetId);
          }
        } else {
          // Radar windows: pan to their own locked units, or any unit if it's the overview mini (no miniMapId)
          shouldPerform = miniMapId 
            ? (miniMaps.find(m => m.id === miniMapId)?.vehicleIds.includes(targetId) ?? false)
            : true; // Overview mini allows panning to any vehicle
        }

        if (shouldPerform) {
          performPan(map, provider, action.payload, 16, currentPadding);
        }
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

  // Auto-Sync Logic for State Transitions
  useEffect(() => {
    if (!map) return;
    
    triggerResize();
    // More aggressive timing: resize immediately and again after container stabilizes
    const t1 = setTimeout(triggerResize, 100);
    const t2 = setTimeout(triggerResize, 350);

    // Early Return: Do not disturb investigator focus during investigations
    if (!isVisible || isIncidenciasSheetOpen || historyVehicle) return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };

    const isGridActive = isMainMap && (visibleMiniMapIds.length > 0 || !!focusedMiniMapId);
    // Use compact padding for minimaps, larger padding for main map
    const currentPadding = !isMainMap ? PADDING_MINIMAP : (isGridActive ? PADDING_WITH_GRID : PADDING_STANDARD);
    
    let targetIds: number[] = [];
    if (manualVehicleIds) {
      targetIds = manualVehicleIds;
    } else if (miniMapId) {
      targetIds = miniMaps.find(m => m.id === miniMapId)?.vehicleIds || [];
    } else if (isMainMap && focusedMiniMapId && !selectedVehicle) {
      targetIds = miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds || [];
    }

    if (targetIds.length > 0) {
      const points = vehicles.filter(v => targetIds.includes(v.id_vehiculo)).map(v => ({ lat: v.lat, lng: v.lng }));
      if (points.length === 1) {
        performPan(map, provider, points[0], 16, currentPadding);
      } else if (points.length > 1) {
        performFitBounds(map, provider, points, currentPadding);
        // Re-fit bounds after container stabilizes to account for dynamic height
        const t3 = setTimeout(() => performFitBounds(map, provider, points, currentPadding), 400);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      }
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } 

    if (isSplitView && !selectedVehicle && despachoBaseRoute.length > 0) {
      const half = Math.ceil(despachoBaseRoute.length / 2);
      const points = side === 'ida' ? despachoBaseRoute.slice(0, half) : despachoBaseRoute.slice(half - 1);
      performFitBounds(map, provider, points, PADDING_STANDARD);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map, provider, isMainMap, side, miniMapId, isSplitView, focusedMiniMapId, !!historyVehicle, isIncidenciasSheetOpen, triggerResize, selectedVehicle, vehicles, miniMaps, visibleMiniMapIds, despachoBaseRoute, isVisible]);
}

function performPan(map: MapInstance, provider: MapProvider, point: { lat: number, lng: number }, zoom: number, padding: ViewportPadding) {
  if (!map) return;
  switch (provider) {
    case 'google':
      if (map instanceof google.maps.Map) {
        // Using fitBounds on a tiny box to respect lateral padding during "pan"
        const offset = 0.0001;
        const bounds = new google.maps.LatLngBounds(
          { lat: point.lat - offset, lng: point.lng - offset },
          { lat: point.lat + offset, lng: point.lng + offset }
        );
        map.fitBounds(bounds, padding);
      }
      break;
    case 'leaflet': 
      if ('setView' in map) (map as L.Map).setView([point.lat, point.lng], zoom, { animate: true }); 
      break;
    case 'mapbox': 
      if ('flyTo' in map) (map as MapRef).flyTo({ center: [point.lng, point.lat], zoom, duration: 800, padding }); 
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
        const bounds: [[number, number], [number, number]] = points.reduce(
          (acc, p) => [
            [Math.min(acc[0][0], p.lng), Math.min(acc[0][1], p.lat)],
            [Math.max(acc[1][0], p.lng), Math.max(acc[1][1], p.lat)]
          ] as [[number, number], [number, number]], 
          [[initial.lng, initial.lat], [initial.lng, initial.lat]] as [[number, number], [number, number]]
        );
        (map as MapRef).fitBounds(bounds, { padding, maxZoom: 16 });
      }
      break;
  }
}
