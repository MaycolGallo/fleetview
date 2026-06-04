'use client';

import React, { useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useFleetDispatch, useFleetState, selectMapVehicles } from '@/context/fleet-context';
import { LeafletRouteSegments } from './leaflet-map-route-segments';
import { LeafletVehicleMarker, LeafletIncidenciaMarker } from './leaflet-map-markers';
import type { Point } from '@/lib/types';

interface LeafletMapControlProps {
  side?: 'ida' | 'vuelta';
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

export function LeafletMapControl({ side, trackedVehicleIds, isOverview }: LeafletMapControlProps) {
  const map = useMap();
  const dispatch = useFleetDispatch();
  const { state } = useFleetState();
  const {
    mapViewport,
    isIncidenciasSheetOpen,
    historyVehicle,
    masterRoute,
    isSplitView,
    focusedMiniMapId,
    miniMaps,
  } = state;

  useEffect(() => {
    if (!map) return;
    try {
      const container = map.getContainer?.();
      const computed = container ? window.getComputedStyle(container) : null;
      console.info('LeafletMapControl mounted', { containerId: container?.id, zoom: map.getZoom?.(), pointerEvents: computed?.pointerEvents });
      // Force-enable interaction handlers in case something disabled them
      if ((map as any).dragging && (map as any).dragging.disable) {
        (map as any).dragging.enable();
      }
      if ((map as any).touchZoom && (map as any).touchZoom.enable) {
        (map as any).touchZoom.enable();
      }
      if ((map as any).doubleClickZoom && (map as any).doubleClickZoom.enable) {
        (map as any).doubleClickZoom.enable();
      }
      // Log dragging enabled state
      try {
        const draggingEnabled = typeof (map as any).dragging?.enabled === 'function' ? (map as any).dragging.enabled() : !!(map as any).dragging?._enabled;
        console.info('Leaflet dragging enabled?', draggingEnabled);
      } catch (e) {
        console.warn('Could not read dragging.enabled()', e);
      }
      // Add temporary pointerdown listeners to trace event targets
      const onContainerPointer = (e: PointerEvent) => console.info('pointerdown on container', { type: e.type, pointerType: e.pointerType, target: (e.target as HTMLElement)?.id });
      const onDocPointer = (e: PointerEvent) => console.info('pointerdown on document', { type: e.type, pointerType: e.pointerType, target: (e.target as HTMLElement)?.id, classes: (e.target as HTMLElement)?.className });
      if (container && container.addEventListener) container.addEventListener('pointerdown', onContainerPointer);
      document.addEventListener('pointerdown', onDocPointer);
    } catch (e) {
      console.warn('Error enabling map interactions', e);
    }

    const isFocusMain = isOverview && focusedMiniMapId;
    const trackingIds = isFocusMain
      ? miniMaps.find((m) => m.id === focusedMiniMapId)?.vehicleIds
      : trackedVehicleIds;

    const shouldPanRadar = (isFocusMain && miniMaps.length > 0) || (!isOverview && trackedVehicleIds && trackedVehicleIds.length > 0);

    if (shouldPanRadar && trackingIds && trackingIds.length > 0) {
      const trackedVehicles = state.vehicles.filter((v) => trackingIds.includes(v.id_vehiculo));
      if (trackedVehicles.length === 1) {
        const v = trackedVehicles[0];
        map.panTo([v.lat, v.lng]);
        if ((map.getZoom() ?? 0) < 16) {
          map.setZoom(16);
        }
      } else if (trackedVehicles.length > 1) {
        const bounds = L.latLngBounds(trackedVehicles.map((v) => [v.lat, v.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      return;
    }

    if (mapViewport.type === 'idle' || mapViewport.type === 'initial') {
      if (map && isSplitView && !historyVehicle && !isIncidenciasSheetOpen && masterRoute.length > 0) {
        try {
          const halfIndex = Math.ceil(masterRoute.length / 2);
          const points = side === 'ida' ? masterRoute.slice(0, halfIndex) : masterRoute.slice(halfIndex - 1);
          const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
          map.fitBounds(bounds, { padding: [50, 50] });
        } catch (error) {
          console.warn('Could not fit Leaflet bounds', error);
        }
      }
      return;
    }

    try {
      if (mapViewport.type === 'pan_to_vehicle') {
        const { lat, lng } = mapViewport.payload;
        map.panTo([lat, lng]);
        if ((map.getZoom() ?? 0) < 15) {
          map.setZoom(15);
        }
      } else if (mapViewport.type === 'fit_bounds' || mapViewport.type === 'fit_route') {
        const points = mapViewport.payload;
        if (points && points.length > 0) {
          if (points.length === 1) {
            map.panTo([points[0].lat, points[0].lng]);
            if ((map.getZoom() ?? 0) < 15) {
              map.setZoom(15);
            }
          } else {
            const bounds = L.latLngBounds(points.map((point: Point) => [point.lat, point.lng] as [number, number]));
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      }
    } catch (error) {
      console.warn('Leaflet map interaction failed', error);
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
    trackedVehicleIds,
    state.vehicles,
    focusedMiniMapId,
    isOverview,
    miniMaps,
  ]);

  const mapVehicles = useMemo(() => selectMapVehicles(state, trackedVehicleIds, isOverview), [state, trackedVehicleIds, isOverview]);

  return (
    <>
      {mapVehicles.map((vehicle) => (
        <LeafletVehicleMarker key={vehicle.id_vehiculo} vehicle={vehicle} />
      ))}
      <LeafletRouteSegments side={side} />
      {isIncidenciasSheetOpen && state.incidencias.map((inc) => (
        <LeafletIncidenciaMarker
          key={inc.id}
          incidencia={inc}
          isSelected={state.selectedIncidenciaId === inc.id}
          onClick={() => dispatch({ type: 'SELECT_INCIDENCIA', payload: inc.id })}
        />
      ))}
    </>
  );
}
