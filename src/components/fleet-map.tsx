
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { useFleetState } from '@/context/fleet-context';
import { useSearchParams } from 'next/navigation';
import type { Vehicle } from '@/lib/types';

const DynamicLeafletFleetMap = dynamic(
  () => import('./leaflet-map').then(mod => mod.LeafletFleetMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  }
);

interface FleetMapProps {
  apiKey: string;
  side?: 'ida' | 'vuelta';
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

export function FleetMap({ apiKey, side, trackedVehicleIds, isOverview }: FleetMapProps) {
  const { state } = useFleetState();
  const searchParams = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const { vehicles, focusedMiniMapId, miniMaps } = state;

  const isFocusMode = isOverview && focusedMiniMapId;
  const focusedGroup = isFocusMode ? miniMaps.find(m => m.id === focusedMiniMapId) : null;

  const trackedVehicles = trackedVehicleIds?.map(id => vehicles.find(v => v.id_vehiculo === id)).filter(Boolean) as Vehicle[] || [];
  const isTrackingView = trackedVehicles.length > 0;

  // Show demo placeholder only in demo mode
  if (isDemoMode) {
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
            {isTrackingView ? `${trackedVehicles.length} Units Radar Lock` : side ? `Visor de Flota: ${side}` : isFocusMode ? `Enfocado: ${focusedGroup?.name}` : 'Visor de Flota Principal'}
          </p>
          <p className="text-xs text-muted-foreground/60 italic">
            [Modo Demo: Mapa Real Desactivado]
          </p>
        </div>
        {(side || isTrackingView || isFocusMode) && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {side && (
              <div className="bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-primary">
                {side === 'ida' ? 'Ida' : 'Vuelta'}
              </div>
            )}
            {isTrackingView && (
              <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-white">
                FOCUS: {trackedVehicles.length} units
              </div>
            )}
            {isFocusMode && (
              <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-white">
                FOCUSED: {focusedGroup?.name}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render Leaflet map for real usage
  return (
    <DynamicLeafletFleetMap 
      side={side} 
      trackedVehicleIds={trackedVehicleIds} 
      isOverview={isOverview} 
    />
  );
}
