
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

export const selectMapVehicles = (state: FleetState, trackedIds?: number[], isOverview?: boolean): Vehicle[] => {
  if (state.historyVehicle) return [state.historyVehicle];

  if (isOverview) {
    if (state.focusedMiniMapId) {
      const group = state.miniMaps.find(m => m.id === state.focusedMiniMapId);
      return state.vehicles.filter(v => group?.vehicleIds.includes(v.id_vehiculo));
    }
    const filtered = selectFilteredVehicles(state);
    const allTrackedIds = state.trackedVehicleIds || [];
    return filtered.filter(v => !allTrackedIds.includes(v.id_vehiculo));
  }

  if (trackedIds !== undefined) return state.vehicles.filter(v => trackedIds.includes(v.id_vehiculo));

  if (state.focusedMiniMapId) {
    const filtered = selectFilteredVehicles(state);
    const allTrackedIds = state.trackedVehicleIds || [];
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
