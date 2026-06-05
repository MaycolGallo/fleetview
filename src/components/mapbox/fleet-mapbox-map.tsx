
'use client';

import React, { useMemo, useRef } from 'react';
import Map, { MapRef, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useFleetState, selectMapVehicles } from '@/context/fleet-context';
import { MapboxVehicleMarker } from './mapbox-vehicle-marker';
import { useMapViewport } from '@/hooks/use-map-viewport';
import { MapboxRoutePolylines } from './mapbox-route-polylines';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWF5dGVrIiwiYSI6ImNtZDBldWVvaDAyZ2cybG9oM2s2emlwMWIifQ.TwQvSriLHhcTdDnBYPB5KQ';

interface FleetMapboxMapProps {
  side?: 'ida' | 'vuelta';
  miniMapId?: string;
  manualVehicleIds?: number[];
  isMainMap?: boolean;
}

export default function FleetMapboxMap(props: FleetMapboxMapProps) {
  const { side, miniMapId, manualVehicleIds, isMainMap } = props;
  const mapRef = useRef<MapRef>(null);
  const { state } = useFleetState();
  const { isMapDark, mapType, showTraffic } = state;

  // Utilize the unified viewport hook
  useMapViewport({
    map: mapRef.current,
    provider: 'mapbox',
    ...props
  });

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, miniMapId, manualVehicleIds, isMainMap), 
    [state, miniMapId, manualVehicleIds, isMainMap]
  );

  const mapStyle = useMemo(() => {
    if (mapType === 'satellite') return 'mapbox://styles/mapbox/satellite-streets-v12';
    return isMapDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';
  }, [mapType, isMapDark]);

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
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <MapboxRoutePolylines side={side} />

        {/* Traffic Layer Support for Mapbox */}
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
          <MapboxVehicleMarker key={v.id_vehiculo} vehicle={v} index={i} />
        ))}
      </Map>
    </div>
  );
}
