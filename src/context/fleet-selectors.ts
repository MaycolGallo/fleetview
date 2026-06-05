
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
 * Main logic to determine which vehicles appear on a specific map instance.
 * Handles four distinct tactical scenarios:
 */
export const selectMapVehicles = (
  state: FleetState, 
  miniMapId?: string, 
  manualVehicleIds?: number[],
  isMainMap?: boolean
): Vehicle[] => {
  // SCENARIO 1: History Mode
  // If we are investigating a specific vehicle's past, only that unit (at its historical position) exists.
  if (state.historyVehicle) return [state.historyVehicle];

  // SCENARIO 2: Manual Override (Public Shared Links)
  // If a list of IDs is passed directly (e.g. from a decoded URL token), show exactly those units.
  if (manualVehicleIds && manualVehicleIds.length > 0) {
    return state.vehicles.filter(v => manualVehicleIds.includes(v.id_vehiculo));
  }

  // SCENARIO 3: Mini-map / Radar Window
  // This instance is a small tactical window. It only shows vehicles belonging to its assigned group.
  if (miniMapId) {
    const group = state.miniMaps.find(m => m.id === miniMapId);
    if (!group) return [];
    return state.vehicles.filter(v => group.vehicleIds.includes(v.id_vehiculo));
  }

  // SCENARIO 4: Main Command Map
  // This is the big background map. It has two sub-behaviors:
  if (isMainMap) {
    // 4a. Promotion/Focus Mode: 
    // If a mini-map group has been "promoted" to the main view, show ONLY that group.
    if (state.focusedMiniMapId) {
      const group = state.miniMaps.find(m => m.id === state.focusedMiniMapId);
      return state.vehicles.filter(v => group?.vehicleIds.includes(v.id_vehiculo));
    }
    
    // 4b. General Fleet Overview:
    // Show the rest of the fleet (respecting filters), but HIDE units already being 
    // tracked in small radar windows to reduce clutter and avoid marker duplication.
    const filtered = selectFilteredVehicles(state);
    const allTrackedIds = state.allTrackedVehicleIds || [];
    return filtered.filter(v => !allTrackedIds.includes(v.id_vehiculo));
  }

  return [];
};

export const selectRouteSummary = (state: FleetState) => {
  const { routeGroups } = state;
  if (!routeGroups || routeGroups.length === 0) {
    return { totalDistance: 0, totalDuration: 0, totalStops: 0, totalStopTime: 0 };
  }

  return routeGroups.reduce(
    (summary, group) => {
      summary.totalDistance += group.total_distance_km;
      summary.totalDuration += group.total_time_seconds / 60;
      if (group.id_estado === 5) {
        summary.totalStops += 1;
        summary.totalStopTime += group.total_time_seconds / 60;
      }
      return summary;
    },
    { totalDistance: 0, totalDuration: 0, totalStops: 0, totalStopTime: 0 }
  );
};
