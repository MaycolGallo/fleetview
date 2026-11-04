'use client';

import { useEffect } from 'react';
import { Circle, MapContainer, Polygon, TileLayer, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

type Point = { lat: number; lng: number };

type Props = {
  shape: 'circle' | 'polygon';
  center: Point | null;
  radius: number;
  polygon: Point[];
};

function PreviewViewport({ points, center, radius }: { points: Point[]; center: Point | null; radius: number }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 2) map.fitBounds(points.map((point) => [point.lat, point.lng] as [number, number]), { padding: [24, 24], animate: false });
    else if (center) map.setView([center.lat, center.lng], radius > 3000 ? 11 : 14, { animate: false });
  }, [center, map, points, radius]);
  return null;
}

export function GeofenceMapPreview({ shape, center, radius, polygon }: Props) {
  const validCenter = center && Number.isFinite(center.lat) && Number.isFinite(center.lng) ? center : { lat: -12.046374, lng: -77.042793 };
  const validPolygon = polygon.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
  const viewportPoints = shape === 'polygon' ? validPolygon : [validCenter];
  return <div className="h-56 overflow-hidden rounded-lg border border-border">
    <MapContainer center={[validCenter.lat, validCenter.lng]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <PreviewViewport points={viewportPoints} center={validCenter} radius={radius} />
      {shape === 'circle' && <Circle center={[validCenter.lat, validCenter.lng]} radius={radius || 1} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2, weight: 2 }} />}
      {shape === 'polygon' && validPolygon.length >= 3 && <Polygon positions={validPolygon.map((point) => [point.lat, point.lng] as LatLngExpression)} pathOptions={{ color: '#a78bfa', fillColor: '#a78bfa', fillOpacity: 0.2, weight: 2 }} />}
    </MapContainer>
  </div>;
}
