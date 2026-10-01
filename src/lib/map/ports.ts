export interface MapPoint {
  lat: number;
  lng: number;
}

export interface MapPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface MapViewportPort {
  panTo(point: MapPoint, zoom: number, padding: MapPadding): Promise<void>;
  fitBounds(points: MapPoint[], padding: MapPadding): Promise<void>;
  resize(): void;
}

export interface MapAdapter<TMap = unknown> extends MapViewportPort {
  readonly provider: string;
  readonly map: TMap | null | undefined;
}

export type MapAdapterFactory = (map: unknown) => MapAdapter;

export interface MapProviderRegistry {
  get(provider: string, map: unknown): MapAdapter;
}
