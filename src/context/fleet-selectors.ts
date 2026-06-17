
'use client';

import type { Vehicle, FleetState, MapFlags } from '@/lib/types';

export const selectVisibleVehicles = (state: FleetState): Vehicle[] => {
  return state.vehicles.filter(v => state.visibleVehicleIds.has(v.id_vehiculo));
};

export const selectFilteredVehicles = (state: FleetState): Vehicle[] => {
  const visibleVehicles = selectVisibleVehicles(state);
  if (state.statusFilter.length === 0) return visibleVehicles;
  return visibleVehicles.filter(v => state.statusFilter.includes(String(v.id_estado)));
};

/**
 * Tactical Marker Selection Engine.
 * Rule: A vehicle is hidden from the main map ONLY if it belongs to a minimap that is CURRENTLY VISIBLE in the grid.
 */
export const selectMapVehicles = (
  state: FleetState, 
  miniMapId?: string, 
  manualVehicleIds?: number[],
  isMainMap?: boolean
): Vehicle[] => {
  // Priority 1: Route History Investigation
  if (state.historyVehicle) {
    return [state.historyVehicle];
  }

  // Priority 2: Manual Public Sharing Overlay
  if (manualVehicleIds && manualVehicleIds.length > 0) {
    return state.vehicles.filter(v => manualVehicleIds.includes(v.id_vehiculo));
  }

  // Priority 3: Minimap/Radar Grid Isolation
  if (miniMapId) {
    const group = state.miniMaps.find(m => m.id === miniMapId);
    if (!group) return [];
    return state.vehicles.filter(v => group.vehicleIds.includes(v.id_vehiculo));
  }

  // Priority 4: Main Command Console
  if (isMainMap) {
    // Sub-Rule A: Focus Mode Locks the view to a specific group
    if (state.focusedMiniMapId) {
      const group = state.miniMaps.find(m => m.id === state.focusedMiniMapId);
      return state.vehicles.filter(v => group?.vehicleIds.includes(v.id_vehiculo));
    }
    
    // Sub-Rule B: General Fleet Overview
    const filtered = selectFilteredVehicles(state);
    
    // Sub-Rule C: Dynamic Unit De-cluttering
    // Vehicles disappear from main map only if their radar window is currently visible/active.
    const visibleRadarVehicleIds = state.miniMaps
      .filter(m => state.visibleMiniMapIds.includes(m.id))
      .flatMap(m => m.vehicleIds);

    return filtered.filter(v => !visibleRadarVehicleIds.includes(v.id_vehiculo));
  }

  return [];
};

export const selectRouteSummary = (state: FleetState) => {
  const { routeGroups } = state;
  const initial = { totalDistance: 0, totalDuration: 0, totalStops: 0, totalStopTime: 0 };
  
  if (!routeGroups || routeGroups.length === 0) return initial;

  return routeGroups.reduce((summary, group) => {
      summary.totalDistance += group.total_distance_km;
      summary.totalDuration += group.total_time_seconds / 60;
      
      if (group.id_estado === 5) {
        summary.totalStops += 1;
        summary.totalStopTime += group.total_time_seconds / 60;
      }
      
      return summary;
    }, initial);
};

export const getMapFlags = (state: FleetState): MapFlags => {
  const isRouteHistoryView = state.isRouteSheetOpen;
  const isFocusedView = !!state.focusedMiniMapId && !isRouteHistoryView;
  const isDetailView = !!state.selectedVehicle && !isRouteHistoryView;
  const isMainView = !isFocusedView && !isDetailView && !isRouteHistoryView;
  
  return {
    isMainView,
    isFocusedView,
    isSplitView: state.isSplitView,
    isRouteHistoryView,
    isDetailView,
  };
};
