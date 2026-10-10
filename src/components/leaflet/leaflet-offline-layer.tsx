'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { tileLayerOffline } from 'leaflet.offline';

interface LeafletOfflineLayerProps {
  url: string;
  attribution: string;
  enabled?: boolean;
}

export function LeafletOfflineLayer({ url, attribution, enabled = true }: LeafletOfflineLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;

    const layer = tileLayerOffline(url, {
      attribution,
      maxZoom: 19,
      crossOrigin: true,
    });
    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [attribution, enabled, map, url]);

  return null;
}
