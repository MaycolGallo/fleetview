'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface LeafletClusteringProps {
  enabled: boolean;
}

export function LeafletClustering({ enabled }: LeafletClusteringProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (enabled) {
      // Create or get existing cluster group
      const existingLayerGroup = map.eachLayer((layer: any) => {
        if (layer instanceof L.MarkerClusterGroup) {
          return layer;
        }
      });

      let markerClusterGroup: L.MarkerClusterGroup | null = null;

      // Find existing cluster group
      map.eachLayer((layer: any) => {
        if (layer instanceof L.MarkerClusterGroup) {
          markerClusterGroup = layer;
        }
      });

      // If no cluster group exists, create one and add all markers to it
      if (!markerClusterGroup) {
        markerClusterGroup = L.markerClusterGroup({
          maxClusterRadius: 80,
          disableClusteringAtZoom: 17,
          iconCreateFunction: (cluster) => {
            const childCount = cluster.getChildCount();
            let c = ' marker-cluster-';
            if (childCount < 10) {
              c += 'small';
            } else if (childCount < 100) {
              c += 'medium';
            } else {
              c += 'large';
            }

            return L.divIcon({
              html: `<div class="flex items-center justify-center w-full h-full font-bold text-white text-sm">${childCount}</div>`,
              className: `marker-cluster${c}`,
              iconSize: L.point(40, 40),
            });
          },
        });

        // Collect all markers and add them to the cluster group
        const markersToCluster: L.Marker[] = [];
        map.eachLayer((layer: any) => {
          if (layer instanceof L.Marker && !(layer instanceof L.MarkerClusterGroup)) {
            markersToCluster.push(layer);
          }
        });

        // Remove markers from map and add to cluster group
        markersToCluster.forEach((marker) => {
          map.removeLayer(marker);
          markerClusterGroup!.addLayer(marker);
        });

        map.addLayer(markerClusterGroup);
      }
    } else {
      // Remove clustering: extract all markers from cluster group and add back to map
      let markerClusterGroup: L.MarkerClusterGroup | null = null;

      map.eachLayer((layer: any) => {
        if (layer instanceof L.MarkerClusterGroup) {
          markerClusterGroup = layer;
        }
      });

      if (markerClusterGroup) {
        const markersToRemoveFromCluster: L.Marker[] = [];

        markerClusterGroup.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
            markersToRemoveFromCluster.push(layer);
          }
        });

        // Remove cluster group from map
        map.removeLayer(markerClusterGroup);

        // Add individual markers back to map
        markersToRemoveFromCluster.forEach((marker) => {
          map.addLayer(marker);
        });
      }
    }
  }, [map, enabled]);

  return null;
}
