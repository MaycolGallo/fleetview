
"use client";

import { APIProvider, Map, ColorScheme } from '@vis.gl/react-google-maps';
import { useFleetState } from '@/context/fleet-context';
import { LIGHT_MAP_ID, DARK_MAP_ID } from '@/lib/map-styles';
import { MapControl } from './map-control';
import { useSearchParams } from 'next/navigation';

interface FleetMapProps {
  apiKey: string;
  side?: 'ida' | 'vuelta';
  trackedVehicleIds?: number[];
}

export function FleetMap({ apiKey, side, trackedVehicleIds }: FleetMapProps) {
  const { state } = useFleetState();
  const searchParams = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const { isMapDark, vehicles } = state;

  const isTrackingView = trackedVehicleIds && trackedVehicleIds.length > 0;
  const trackingLabel = isTrackingView 
    ? vehicles.filter(v => trackedVehicleIds.includes(v.id_vehiculo)).map(v => v.placa).join(', ')
    : null;

  // If we are in demo mode or the key is a mock, we show a styled placeholder
  if (isDemoMode || apiKey === 'MOCK_KEY') {
    return (
      <div className="w-full h-full relative bg-muted/20 flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/10">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ 
               backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)',
               backgroundSize: '40px 40px' 
             }} 
        />
        <div className="text-center z-10 px-6">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {isTrackingView ? `Tracking: ${trackingLabel}` : side ? `Visor de Flota: ${side}` : 'Visor de Flota Principal'}
          </p>
          <p className="text-xs text-muted-foreground/60 italic">
            [Modo Demo: Mapa Real Desactivado]
          </p>
        </div>
        {(side || isTrackingView) && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {side && (
              <div className="bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-primary">
                {side === 'ida' ? 'Ida' : 'Vuelta'}
              </div>
            )}
            {isTrackingView && (
              <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-white">
                FOCUS
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full relative">
        <Map 
            defaultCenter={{ lat: -12.046374, lng: -77.042793 }}
            defaultZoom={isTrackingView ? 16 : 13}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={isMapDark ? DARK_MAP_ID : LIGHT_MAP_ID}
            colorScheme={isMapDark ? ColorScheme.dark : ColorScheme.light}
        >
          <MapControl side={side} trackedVehicleIds={trackedVehicleIds} />
        </Map>
        {(side || isTrackingView) && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {side && (
              <div className="bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-primary">
                {side === 'ida' ? 'Ida' : 'Vuelta'}
              </div>
            )}
            {isTrackingView && (
              <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-white">
                FOCUS
              </div>
            )}
          </div>
        )}
      </div>
    </APIProvider>
  );
}
