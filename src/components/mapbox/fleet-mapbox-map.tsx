'use client';

import React, { useMemo, useRef } from 'react';
import Map, { MapRef } from 'react-map-gl';
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
  const { isMapDark } = state;

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
        mapStyle={isMapDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12'}
        style={{ width: '100%', height: '100%' }}
      >
        <MapboxRoutePolylines side={side} />

        {mapVehicles.map((v, i) => (
          <MapboxVehicleMarker key={v.id_vehiculo} vehicle={v} index={i} />
        ))}
      </Map>
    </div>
  );
}
