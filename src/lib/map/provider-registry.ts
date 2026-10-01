import { createGoogleAdapter, createLeafletAdapter, createMapboxAdapter } from './adapters';
import { createMapProviderRegistry } from './registry';

export const mapProviderRegistry = createMapProviderRegistry({
  google: (map) => createGoogleAdapter(map as google.maps.Map | null | undefined),
  leaflet: (map) => createLeafletAdapter(map as import('leaflet').Map | null | undefined),
  mapbox: (map) => createMapboxAdapter(map as import('react-map-gl').MapRef | null | undefined),
});
