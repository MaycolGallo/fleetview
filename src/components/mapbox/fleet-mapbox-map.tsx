
'use client';

/**
 * @fileOverview Tactical Mapbox GL Implementation.
 * Features hardware-accelerated rendering and localized Spanish labels.
 */

import React, { useMemo, useRef, useCallback } from 'react';
import Map, { MapRef, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useFleetState, selectMapVehicles } from '@/context/fleet-context';
import { MapboxVehicleMarker } from './mapbox-vehicle-marker';
import { useMapViewport } from '@/hooks/use-map-viewport';
import { MapboxRoutePolylines } from './mapbox-route-polylines';

// Use environment variable for the Mapbox token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface FleetMapboxMapProps {
  side?: 'ida' | 'vuelta';
  miniMapId?: string;
  manualVehicleIds?: number[];
  isMainMap?: boolean;
  isVisible?: boolean;
}

export default function FleetMapboxMap(props: FleetMapboxMapProps) {
  const { side, miniMapId, manualVehicleIds, isMainMap, isVisible = true } = props;
  const mapRef = useRef<MapRef>(null);
  const { state } = useFleetState();
  const { isMapDark, mapType, showTraffic } = state;

  // Utilize the unified viewport hook for consistent framing
  useMapViewport({
    map: mapRef.current,
    provider: 'mapbox',
    ...props,
    isVisible
  });

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, miniMapId, manualVehicleIds, isMainMap), 
    [state, miniMapId, manualVehicleIds, isMainMap]
  );

  const mapStyle = useMemo(() => {
    switch (mapType) {
        case 'satellite': return 'mapbox://styles/mapbox/satellite-streets-v12';
        default: return isMapDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';
    }
  }, [mapType, isMapDark]);

  /**
   * Tactical Localization: Forces labels to Spanish (es) using Mapbox GL expressions.
   */
  const handleMapLoad = useCallback((evt: any) => {
    const map = evt.target;
    const layers = map.getStyle().layers;
    
    if (layers) {
      layers.forEach((layer: any) => {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          map.setLayoutProperty(layer.id, 'text-field', [
            'coalesce',
            ['get', 'name_es'],
            ['get', 'name']
          ]);
        }
      });
    }
  }, []);

  if (!MAPBOX_TOKEN) {
      return (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs font-bold uppercase tracking-widest">
              Mapbox Token Missing
          </div>
      );
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: -12.046374,
          longitude: -77.042793,
          zoom: 13
        }}
        onLoad={handleMapLoad}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <MapboxRoutePolylines side={side} />

        {showTraffic && (
          <Source id="mapbox-traffic" type="vector" url="mapbox://mapbox.mapbox-traffic-v1">
            <Layer
              id="traffic-layer"
              type="line"
              source="mapbox-traffic"
              source-layer="traffic"
              paint={{
                'line-width': 1.5,
                'line-color': [
                  'match',
                  ['get', 'congestion'],
                  'low', '#39e339',
                  'moderate', '#f1f114',
                  'heavy', '#ff9f1a',
                  'severe', '#ff4d4d',
                  '#000000'
                ]
              }}
            />
          </Source>
        )}

        {mapVehicles.map((v, i) => (
          <MapboxVehicleMarker 
            key={v.id_vehiculo} 
            vehicle={v} 
            index={i} 
            showPopup={isMainMap && !miniMapId}
          />
        ))}
      </Map>
    </div>
  );
}
