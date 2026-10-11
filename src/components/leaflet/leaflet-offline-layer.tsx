'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ complete: 0, total: 0 });
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const layerRef = useRef<ReturnType<typeof tileLayerOffline> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const layer = tileLayerOffline(url, {
      attribution,
      maxZoom: 19,
      crossOrigin: true,
    });
    layerRef.current = layer;
    layer.addTo(map);

    let cancelled = false;
    const cacheVisibleTiles = async () => {
      const tiles = layer.getTileUrls(map.getPixelBounds(), map.getZoom());
      await Promise.all(
        tiles.map(async (tile) => {
          if (cancelled) return;
          try {
            const blob = await downloadTile(tile.url);
            if (!cancelled) await saveTile(tile, blob);
          } catch {
            // Tile caching is best effort; the online layer remains usable.
          }
        }),
      );
    };

    void cacheVisibleTiles();
    map.on('moveend zoomend', cacheVisibleTiles);

    return () => {
      cancelled = true;
      map.off('moveend zoomend', cacheVisibleTiles);
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [attribution, enabled, map, url]);

  const downloadCurrentArea = async () => {
    if (isDownloading) return;
    const tiles = layerRef.current?.getTileUrls(map.getPixelBounds(), map.getZoom()) ?? [];
    if (tiles.length === 0) return;

    setIsDownloading(true);
    setDownloadMessage(null);
    setDownloadProgress({ complete: 0, total: tiles.length });
    let complete = 0;

    await Promise.all(tiles.map(async (tile) => {
      try {
        const blob = await downloadTile(tile.url);
        await saveTile(tile, blob);
      } catch {
        // Individual unavailable tiles do not cancel the area download.
      } finally {
        complete += 1;
        setDownloadProgress({ complete, total: tiles.length });
      }
    }));

    setIsDownloading(false);
    setDownloadMessage(`Zona guardada: ${complete}/${tiles.length} tiles`);
  };

  return (
    <div className="absolute right-3 top-3 z-[1000] rounded-md border border-border/60 bg-background/90 p-2 shadow-lg backdrop-blur-sm">
      <button
        type="button"
        onClick={() => void downloadCurrentArea()}
        disabled={isDownloading}
        className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
      >
        {isDownloading ? `Guardando ${downloadProgress.complete}/${downloadProgress.total}` : 'Guardar zona offline'}
      </button>
      {downloadMessage && <p className="mt-1 text-[10px] text-muted-foreground">{downloadMessage}</p>}
    </div>
  );
}
