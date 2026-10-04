import type { MapPadding, MapPoint } from './ports';

export const PADDING_STANDARD: MapPadding = { top: 80, bottom: 80, left: 80, right: 80 };
export const PADDING_ROUTE: MapPadding = { top: 80, bottom: 280, left: 80, right: 80 };
export const PADDING_MINIMAP: MapPadding = { top: 20, bottom: 20, left: 20, right: 20 };

export function sortPoints(points: MapPoint[]) {
  return [...points].sort((a, b) => a.lat - b.lat || a.lng - b.lng);
}

export function pointsKey(points: MapPoint[]) {
  return JSON.stringify(sortPoints(points));
}

export function splitRoutePoints(route: MapPoint[], side?: 'ida' | 'vuelta') {
  const half = Math.ceil(route.length / 2);
  if (side === 'ida') return route.slice(0, half);
  if (side === 'vuelta') return route.slice(half - 1);
  return [];
}

export function shouldMapHandleVehicle({
  isMainMap,
  focusedMiniMapId,
  visibleMiniMapIds,
  miniMapId,
  miniMaps,
  targetId,
}: {
  isMainMap?: boolean;
  focusedMiniMapId?: string;
  visibleMiniMapIds: string[];
  miniMapId?: string;
  miniMaps: Array<{ id: string; vehicleIds: number[] }>;
  targetId: number;
}) {
  if (isMainMap) {
    if (focusedMiniMapId) {
      return miniMaps.find((map) => map.id === focusedMiniMapId)?.vehicleIds.includes(targetId) ?? false;
    }
    const radarIds = miniMaps
      .filter((map) => visibleMiniMapIds.includes(map.id))
      .flatMap((map) => map.vehicleIds);
    return !radarIds.includes(targetId);
  }

  if (!miniMapId) return true;
  return miniMaps.find((map) => map.id === miniMapId)?.vehicleIds.includes(targetId) ?? false;
}
