
'use client';

import React from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { Radar, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

const FleetMap = dynamic(() => import('../fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export function MiniMapOverlayGrid({ apiKey }: { apiKey: string }) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { miniMaps } = state;

  if (miniMaps.length === 0) return null;

  return (
    <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-4 pointer-events-none max-h-[75vh] overflow-y-auto pr-2 no-scrollbar">
      {miniMaps.map((map) => (
        <div 
          key={map.id} 
          className="pointer-events-auto relative w-48 sm:w-64 aspect-square border-2 rounded-2xl overflow-hidden shadow-2xl bg-card ring-2 ring-primary/10 animate-in slide-in-from-right-8"
        >
          <FleetMap apiKey={apiKey} trackedVehicleIds={map.vehicleIds} />
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            <div className="bg-primary px-1.5 py-0.5 rounded shadow-sm text-[8px] font-bold text-white uppercase flex items-center gap-1">
              <Radar className="w-2 h-2" />
              {map.name}
            </div>
            <div className="bg-card/90 backdrop-blur-sm px-1.5 py-0.5 rounded border shadow-sm text-[8px] font-bold text-foreground uppercase">
              {map.vehicleIds.length} units
            </div>
          </div>
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 right-2 h-6 w-6 z-20 shadow-lg hover:scale-110 transition-transform"
            onClick={() => dispatch({ type: 'REMOVE_MINIMAP', payload: map.id })}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
