
'use client';

import type { Vehicle, FleetState } from '@/lib/types';

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
 * Optimized with early returns to handle distinct display scenarios.
 * Rule: A vehicle is hidden from the main map ONLY if it belongs to a minimap that is CURRENTLY VISIBLE.
 */
export const selectMapVehicles = (
  state: FleetState, 
  miniMapId?: string, 
  manualVehicleIds?: number[],
  isMainMap?: boolean
): Vehicle[] => {
  // SCENARIO 1: History Mode
  if (state.historyVehicle) {
    return [state.historyVehicle];
  }

  // SCENARIO 2: Manual Override (Public Sharing)
  if (manualVehicleIds && manualVehicleIds.length > 0) {
    return state.vehicles.filter(v => manualVehicleIds.includes(v.id_vehiculo));
  }

  // SCENARIO 3: Mini-map / Radar isolation
  if (miniMapId) {
    const group = state.miniMaps.find(m => m.id === miniMapId);
    if (!group) return [];
    return state.vehicles.filter(v => group.vehicleIds.includes(v.id_vehiculo));
  }

  // SCENARIO 4: Main Command Map
  if (isMainMap) {
    // Sub-Scenario A: Focus Mode
    if (state.focusedMiniMapId) {
      const group = state.miniMaps.find(m => m.id === state.focusedMiniMapId);
      return state.vehicles.filter(v => group?.vehicleIds.includes(v.id_vehiculo));
    }
    
    // Sub-Scenario B: General Overview
    const filtered = selectFilteredVehicles(state);
    
    // Identify vehicles that belong to ACTIVE/VISIBLE minimaps
    const visibleRadarVehicleIds = state.miniMaps
      .filter(m => state.visibleMiniMapIds.includes(m.id))
      .flatMap(m => m.vehicleIds);

    // Hide only those that are currently locked in visible radar windows
    return filtered.filter(v => !visibleRadarVehicleIds.includes(v.id_vehiculo));
  }

  return [];
};

export const selectRouteSummary = (state: FleetState) => {
  const { routeGroups } = state;
  const initial = { totalDistance: 0, totalDuration: 0, totalStops: 0, totalStopTime: 0 };
  
  if (!routeGroups || routeGroups.length === 0) {
    return initial;
  }

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
