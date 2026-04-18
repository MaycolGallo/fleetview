"use client";

import { APIProvider, Map, ColorScheme } from '@vis.gl/react-google-maps';
import { useFleetState } from '@/context/fleet-context';
import { LIGHT_MAP_ID, DARK_MAP_ID } from '@/lib/map-styles';
import { MapControl } from './map-control';

interface FleetMapProps {
  apiKey: string;
  side?: 'ida' | 'vuelta';
}

export function FleetMap({ apiKey, side }: FleetMapProps) {
  const { state } = useFleetState();
  const { isMapDark } = state;
  
  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full relative">
        <Map 
            defaultCenter={{ lat: -12.046374, lng: -77.042793 }}
            defaultZoom={13}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={isMapDark ? DARK_MAP_ID : LIGHT_MAP_ID}
            colorScheme={isMapDark ? ColorScheme.dark : ColorScheme.light}
        >
          <MapControl side={side} />
        </Map>
        {side && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-primary">
              {side === 'ida' ? 'Ida' : 'Vuelta'}
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
