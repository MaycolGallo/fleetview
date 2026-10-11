'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  downloadTile,
  saveTile,
  tileLayerOffline,
} from 'leaflet.offline';

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

    let cancelled = false;
    const cacheVisibleTiles = async () => {
      const tiles = layer.getTileUrls(map.getPixelBounds(), map.getZoom());
      for (const tile of tiles) {
        if (cancelled) return;
        try {
          const blob = await downloadTile(tile.url);
          if (!cancelled) await saveTile(tile, blob);
        } catch {
          // Tile caching is best effort; the online layer remains usable.
        }
      }
    };

    void cacheVisibleTiles();
    map.on('moveend zoomend', cacheVisibleTiles);

    return () => {
      cancelled = true;
      map.off('moveend zoomend', cacheVisibleTiles);
      map.removeLayer(layer);
    };
  }, [attribution, enabled, map, url]);

  return null;
}
