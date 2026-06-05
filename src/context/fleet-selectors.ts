
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
 * Handles:
 * 1. History mode (single vehicle)
 * 2. Shared/Manual mode (token payload)
 * 3. Mini-map/Radar mode (group lookup)
 * 4. Main Map mode (remaining visible vehicles)
 */
export const selectMapVehicles = (
  state: FleetState, 
  miniMapId?: string, 
  manualVehicleIds?: number[],
  isMainMap?: boolean
): Vehicle[] => {
  // 1. If we are viewing a vehicle's history, only that vehicle exists on map
  if (state.historyVehicle) return [state.historyVehicle];

  // 2. Manual list override (e.g., Public Shared View via Token)
  if (manualVehicleIds && manualVehicleIds.length > 0) {
    return state.vehicles.filter(v => manualVehicleIds.includes(v.id_vehiculo));
  }

  // 3. Radar Group lookup (Mini-map instance)
  if (miniMapId) {
    const group = state.miniMaps.find(m => m.id === miniMapId);
    if (!group) return [];
    return state.vehicles.filter(v => group.vehicleIds.includes(v.id_vehiculo));
  }

  // 4. Main Map Logic
  if (isMainMap) {
    // If a specific group is focused (Promoted from mini to main)
    if (state.focusedMiniMapId) {
      const group = state.miniMaps.find(m => m.id === state.focusedMiniMapId);
      return state.vehicles.filter(v => group?.vehicleIds.includes(v.id_vehiculo));
    }
    
    // Otherwise, show filtered vehicles that are NOT currently in any active radar group
    // to keep the main view clean and focused on untracked units.
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
