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

const PADDING_STANDARD: ViewportPadding = { top: 80, bottom: 80, left: 80, right: 80 };
const PADDING_ROUTE: ViewportPadding = { top: 80, bottom: 280, left: 80, right: 80 };
const PADDING_WITH_GRID: ViewportPadding = { top: 80, bottom: 80, left: 80, right: 440 };

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
      case 'leaflet': if ('invalidateSize' in map) (map as L.Map).invalidateSize({ animate: false, noMove: true }); break;
      case 'mapbox': if ('resize' in map) (map as MapRef).resize(); break;
      case 'google': if (typeof google !== 'undefined' && map instanceof google.maps.Map) google.maps.event.trigger(map, 'resize'); break;
    }
  }, [map, provider]);

  useEffect(() => {
    if (!map || mapViewport.type === 'idle' || mapViewport.type === 'initial') return;

    const action = mapViewport;
    const isGridActive = isMainMap && visibleMiniMapIds.length > 0;
    const currentPadding = isGridActive ? PADDING_WITH_GRID : PADDING_STANDARD;

    switch (action.type) {
      case 'pan_to_vehicle': {
        const targetId = action.vehicleId;
        let shouldPerform = false;

        if (isMainMap) {
          if (focusedMiniMapId) {
            shouldPerform = miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds.includes(targetId) ?? false;
          } else {
            const radarIds = miniMaps.filter(m => visibleMiniMapIds.includes(m.id)).flatMap(m => m.vehicleIds);
            shouldPerform = !radarIds.includes(targetId);
          }
        } else {
          shouldPerform = miniMapId ? (miniMaps.find(m => m.id === miniMapId)?.vehicleIds.includes(targetId) ?? false) : false;
        }

        if (shouldPerform) performPan(map, provider, action.payload, 16, currentPadding);
        break;
      }
      case 'fit_bounds': performFitBounds(map, provider, action.payload, currentPadding); break;
      case 'fit_route': performFitBounds(map, provider, action.payload, PADDING_ROUTE); break;
    }
    
    dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' });
  }, [map, mapViewport, provider, isMainMap, miniMapId, focusedMiniMapId, visibleMiniMapIds, miniMaps, dispatch]);

  useEffect(() => {
    if (!map) return;
    triggerResize();
    const t = setTimeout(triggerResize, 350);

    if (!isVisible || isIncidenciasSheetOpen || historyVehicle) return () => clearTimeout(t);

    const isGridActive = isMainMap && visibleMiniMapIds.length > 0;
    const currentPadding = isGridActive ? PADDING_WITH_GRID : PADDING_STANDARD;
    
    let targetIds: number[] = [];
    if (manualVehicleIds) targetIds = manualVehicleIds;
    else if (miniMapId) targetIds = miniMaps.find(m => m.id === miniMapId)?.vehicleIds || [];
    else if (isMainMap && focusedMiniMapId && !selectedVehicle) targetIds = miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds || [];

    if (targetIds.length > 0) {
      const points = vehicles.filter(v => targetIds.includes(v.id_vehiculo)).map(v => ({ lat: v.lat, lng: v.lng }));
      if (points.length === 1) performPan(map, provider, points[0], 16, currentPadding);
      else if (points.length > 1) performFitBounds(map, provider, points, currentPadding);
      return () => clearTimeout(t);
    } 

    if (isSplitView && !selectedVehicle && despachoBaseRoute.length > 0) {
      const half = Math.ceil(despachoBaseRoute.length / 2);
      const points = side === 'ida' ? despachoBaseRoute.slice(0, half) : despachoBaseRoute.slice(half - 1);
      performFitBounds(map, provider, points, PADDING_STANDARD);
    }

    return () => clearTimeout(t);
  }, [map, provider, isMainMap, side, miniMapId, isSplitView, focusedMiniMapId, !!historyVehicle, isIncidenciasSheetOpen, triggerResize, selectedVehicle, vehicles, miniMaps, visibleMiniMapIds, despachoBaseRoute, isVisible]);
}

function performPan(map: MapInstance, provider: MapProvider, point: { lat: number, lng: number }, zoom: number, padding: ViewportPadding) {
  if (!map) return;
  switch (provider) {
    case 'google':
      if (map instanceof google.maps.Map) {
        map.setZoom(zoom);
        map.panTo(point);
        if (padding.right > 80) map.panBy((padding.right - 80) / 2, 0);
      }
      break;
    case 'leaflet': if ('setView' in map) (map as L.Map).setView([point.lat, point.lng], zoom, { animate: true }); break;
    case 'mapbox': if ('flyTo' in map) (map as MapRef).flyTo({ center: [point.lng, point.lat], zoom, duration: 800, padding }); break;
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
        if (padding.right > 80) map.panBy((padding.right - 80) / 2, 0);
      }
      break;
    case 'leaflet':
      if ('fitBounds' in map) {
        const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
        (map as L.Map).fitBounds(bounds, { paddingTopLeft: [padding.left, padding.top], paddingBottomRight: [padding.right, padding.bottom], animate: true, maxZoom: 16 });
      }
      break;
    case 'mapbox':
      if ('fitBounds' in map) {
        const initial = points[0];
        const bounds: [[number, number], [number, number]] = points.reduce((acc, p) => [[Math.min(acc[0][0], p.lng), Math.min(acc[0][1], p.lat)], [Math.max(acc[1][0], p.lng), Math.max(acc[1][1], p.lat)]] as [[number, number], [number, number]], [[initial.lng, initial.lat], [initial.lng, initial.lat]] as [[number, number], [number, number]]);
        (map as MapRef).fitBounds(bounds, { padding, maxZoom: 16 });
      }
      break;
  }
}
