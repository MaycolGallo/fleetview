'use client';

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import type { MapProvider } from '@/lib/types';
import { mapProviderRegistry } from '@/lib/map/provider-registry';
import { createViewportActions } from '@/lib/map/viewport-actions';
import {
  PADDING_MINIMAP,
  PADDING_ROUTE,
  PADDING_STANDARD,
  pointsKey,
  shouldMapHandleVehicle,
  splitRoutePoints,
} from '@/lib/map/viewport-policy';

type MapInstance = unknown;

interface UseMapViewportProps {
  map: MapInstance;
  provider: MapProvider;
  isMainMap?: boolean;
  side?: 'ida' | 'vuelta';
  miniMapId?: string;
  manualVehicleIds?: number[];
  isVisible?: boolean;
}

// Debounce timer for performPan to prevent rapid successive pans
let lastPanTime = 0;
const PAN_DEBOUNCE_MS = 300;

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
  const lastFittedBoundsRef = useRef<string>('');
  const actionGenerationRef = useRef(0);
  const intentionalMoveUntilRef = useRef(0);
  const actionRunningRef = useRef(false);

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
    selectedVehicle,
    mapControlPadding
  } = state;

  const adapter = useMemo(
    () => (map ? mapProviderRegistry.get(provider, map) : null),
    [map, provider],
  );
  const viewportActions = useMemo(
    () => (adapter ? createViewportActions(adapter) : null),
    [adapter],
  );

  const triggerResize = useCallback(() => {
    adapter?.resize();
  }, [adapter]);

  // Reactive Logic for Specific Viewport Actions
  useEffect(() => {
    if (!viewportActions) return;
    if (mapViewport.type === 'idle' || mapViewport.type === 'initial') return;

    const isGridActive = isMainMap && (visibleMiniMapIds.length > 0 || !!focusedMiniMapId);
    const currentPadding = !isMainMap ? PADDING_MINIMAP : (isGridActive ? mapControlPadding : PADDING_STANDARD);

    const handlePanToVehicle = async () => {
      const targetId = (mapViewport as any).vehicleId;
      
      // Determine if this map should respond to the pan request
      if (!shouldMapHandleVehicle({
        isMainMap,
        focusedMiniMapId,
        visibleMiniMapIds,
        miniMapId,
        miniMaps,
        targetId,
      })) return;

      // Debounce rapid pan requests
      const now = Date.now();
      if (now - lastPanTime <= PAN_DEBOUNCE_MS) return;
      lastPanTime = now;

      await viewportActions.pan((mapViewport as any).payload, 16, currentPadding);
    };

    const generation = ++actionGenerationRef.current;
    intentionalMoveUntilRef.current = Date.now() + 1200;
    actionRunningRef.current = true;

    const runAction = async () => {
      switch (mapViewport.type) {
        case 'pan_to_vehicle':
          await handlePanToVehicle();
          break;
        case 'fit_bounds':
          await viewportActions.fit((mapViewport as any).payload, currentPadding);
          break;
        case 'fit_route':
          await viewportActions.fit((mapViewport as any).payload, PADDING_ROUTE);
          break;
      }

      if (generation === actionGenerationRef.current) {
        actionRunningRef.current = false;
        dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' });
      }
    };

    void runAction();
  }, [mapViewport, viewportActions, isMainMap, miniMapId, focusedMiniMapId, visibleMiniMapIds, miniMaps, dispatch, mapControlPadding]);

  // Auto-Sync Logic for State Transitions
  useEffect(() => {
    if (!viewportActions) return;
    
    // Resize with staggered timers
    triggerResize();
    const t1 = setTimeout(triggerResize, 100);
    const t2 = setTimeout(triggerResize, 350);

    // Cleanup helper to avoid repetition
    const cleanup = (...timers: NodeJS.Timeout[]) => () => timers.forEach(clearTimeout);

    // Explicit viewport actions own the map briefly; background fitting must not override them.
    if (actionRunningRef.current || Date.now() < intentionalMoveUntilRef.current) {
      return cleanup(t1, t2);
    }

    // Early return: don't adjust viewport during investigations or when hidden
    if (!isVisible || isIncidenciasSheetOpen || historyVehicle) {
      return cleanup(t1, t2);
    }

    const isGridActive = isMainMap && (visibleMiniMapIds.length > 0 || !!focusedMiniMapId);
    const currentPadding = !isMainMap ? PADDING_MINIMAP : (isGridActive ? mapControlPadding : PADDING_STANDARD);
    
    // Determine target vehicles for this map instance
    let targetIds: number[] = [];
    switch (true) {
      case !!manualVehicleIds?.length:
        targetIds = manualVehicleIds;
        break;
      case !!miniMapId:
        targetIds = miniMaps.find(m => m.id === miniMapId)?.vehicleIds || [];
        break;
      case isMainMap && !!focusedMiniMapId && !selectedVehicle:
        targetIds = miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds || [];
        break;
      default:
        targetIds = [];
    }

    // Handle vehicle bounds fitting
    if (targetIds.length === 0) {
      // Continue to split view handling below
    } else {
      const points = vehicles
        .filter(v => targetIds.includes(v.id_vehiculo))
        .map(v => ({ lat: v.lat, lng: v.lng }));

      // Only fit bounds if points have actually changed
      const boundsKey = pointsKey(points);
      if (lastFittedBoundsRef.current === boundsKey) {
        return cleanup(t1, t2);
      }
      lastFittedBoundsRef.current = boundsKey;

      switch (points.length) {
        case 0:
          return cleanup(t1, t2);
        case 1:
          void viewportActions.pan(points[0], 16, currentPadding);
          return cleanup(t1, t2);
        default:
          void viewportActions.fit(points, currentPadding);
          const t3 = setTimeout(() => void viewportActions.fit(points, currentPadding), 400);
          return cleanup(t1, t2, t3);
      }
    }

    // Handle split view route fitting
    if (isSplitView && !selectedVehicle && despachoBaseRoute.length > 0) {
      const points = splitRoutePoints(despachoBaseRoute, side);
      if (points.length > 0) {
        void viewportActions.fit(points, PADDING_STANDARD);
      }
    }

    return cleanup(t1, t2);
  }, [viewportActions, isMainMap, side, miniMapId, isSplitView, focusedMiniMapId, !!historyVehicle, isIncidenciasSheetOpen, triggerResize, selectedVehicle, vehicles, miniMaps, visibleMiniMapIds, despachoBaseRoute, isVisible, manualVehicleIds, mapControlPadding]);
}
