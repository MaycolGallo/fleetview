import type { MapAdapter, MapPadding, MapPoint } from './ports';

export interface ViewportActions {
  pan(point: MapPoint, zoom: number, padding: MapPadding): Promise<void>;
  fit(points: MapPoint[], padding: MapPadding): Promise<void>;
}

export function createViewportActions(adapter: MapAdapter): ViewportActions {
  return {
    pan: (point, zoom, padding) => adapter.panTo(point, zoom, padding),
    fit: (points, padding) => adapter.fitBounds(points, padding),
  };
}
