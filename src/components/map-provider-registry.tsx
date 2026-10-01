import type { ComponentType } from 'react';
import FleetMap from './fleet-map';
import FleetLeafletMap from './leaflet/fleet-leaflet-map';
import FleetMapboxMap from './mapbox/fleet-mapbox-map';

type MapRendererProps = {
  apiKey: string;
  side?: 'ida' | 'vuelta';
  isMainMap?: boolean;
  isVisible?: boolean;
};

const renderers: Record<string, ComponentType<MapRendererProps>> = {
  google: FleetMap,
  leaflet: FleetLeafletMap,
  mapbox: FleetMapboxMap,
};

export function MapProviderRenderer({ provider, ...props }: MapRendererProps & { provider: string }) {
  const Renderer = renderers[provider] ?? renderers.google;
  return <Renderer {...props} />;
}
