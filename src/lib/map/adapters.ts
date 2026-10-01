import L from 'leaflet';
import type { MapRef } from 'react-map-gl';
import type { MapAdapter, MapPadding, MapPoint } from './ports';

const settle = (duration: number) => new Promise<void>((resolve) => window.setTimeout(resolve, duration));

export function createGoogleAdapter(map: google.maps.Map | null | undefined): MapAdapter<google.maps.Map> {
  return {
    provider: 'google', map,
    panTo(point: MapPoint, _zoom: number, padding: MapPadding) {
      if (!map) return Promise.resolve();
      const offset = 0.0001;
      const bounds = new google.maps.LatLngBounds(
        { lat: point.lat - offset, lng: point.lng - offset },
        { lat: point.lat + offset, lng: point.lng + offset },
      );
      map.fitBounds(bounds, padding);
      return settle(500);
    },
    fitBounds(points: MapPoint[], padding: MapPadding) {
      if (!map || points.length === 0) return Promise.resolve();
      const bounds = new google.maps.LatLngBounds();
      points.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, padding);
      return settle(500);
    },
    resize() {
      if (map) google.maps.event.trigger(map, 'resize');
    },
  };
}

export function createLeafletAdapter(map: L.Map | null | undefined): MapAdapter {
  return {
    provider: 'leaflet', map,
    panTo(point, zoom) {
      map?.setView([point.lat, point.lng], zoom, { animate: true });
      return settle(450);
    },
    fitBounds(points, padding) {
      if (!map || points.length === 0) return Promise.resolve();
      const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
      map.fitBounds(bounds, {
        paddingTopLeft: [padding.left, padding.top],
        paddingBottomRight: [padding.right, padding.bottom],
        animate: true,
        maxZoom: 16,
      });
      return settle(450);
    },
    resize() { map?.invalidateSize({ animate: false, noMove: true }); },
  };
}

export function createMapboxAdapter(map: import('react-map-gl').MapRef | null | undefined): MapAdapter {
  return {
    provider: 'mapbox', map,
    panTo(point, zoom, padding) {
      map?.flyTo({ center: [point.lng, point.lat], zoom, duration: 800, padding });
      return settle(850);
    },
    fitBounds(points, padding) {
      if (!map || points.length === 0) return Promise.resolve();
      const initial = points[0];
      const bounds = points.reduce(
        (acc, point) => [[Math.min(acc[0][0], point.lng), Math.min(acc[0][1], point.lat)], [Math.max(acc[1][0], point.lng), Math.max(acc[1][1], point.lat)]] as [[number, number], [number, number]],
        [[initial.lng, initial.lat], [initial.lng, initial.lat]] as [[number, number], [number, number]],
      );
      map.fitBounds(bounds, { padding, maxZoom: 16 });
      return settle(850);
    },
    resize() { map?.resize(); },
  };
}
