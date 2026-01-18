
"use client";

import { APIProvider, Map, ColorScheme } from '@vis.gl/react-google-maps';
import { useFleet } from '@/context/fleet-context';
import { LIGHT_MAP_ID, DARK_MAP_ID } from '@/lib/map-styles';
import { MapControl } from './map-control';
import { useRef } from 'react';

interface FleetMapProps {
  apiKey: string;
}

export function FleetMap({ apiKey }: FleetMapProps) {
  const { state, dispatch } = useFleet();
  const { isMapDark } = state;
  const didDrag = useRef(false);
  
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }

    if (e.domEvent.target instanceof HTMLElement && e.domEvent.target.closest('[data-vehicle-id]')) {
      return;
    }
    dispatch({ type: 'PAN_TO_VEHICLE', payload: null });
  };

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full">
        <Map 
            defaultCenter={{ lat: -12.046374, lng: -77.042793 }}
            defaultZoom={13}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={isMapDark ? DARK_MAP_ID : LIGHT_MAP_ID}
            onClick={handleMapClick}
            onDragStart={() => { didDrag.current = true; }}
            colorScheme={isMapDark ? ColorScheme.dark : ColorScheme.light}
        >
          <MapControl />
        </Map>
      </div>
    </APIProvider>
  );
}
