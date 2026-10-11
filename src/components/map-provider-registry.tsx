import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import FleetMap from './fleet-map';

const FleetLeafletMap = dynamic(() => import('./leaflet/fleet-leaflet-map'), {
  ssr: false,
});
const FleetMapboxMap = dynamic(() => import('./mapbox/fleet-mapbox-map'), {
  ssr: false,
});

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
