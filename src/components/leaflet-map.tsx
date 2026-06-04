'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useSearchParams } from 'next/navigation';
import { useFleetState } from '@/context/fleet-context';
import { LeafletMapControl } from './leaflet-map-control';
import type { Vehicle } from '@/lib/types';

interface FleetMapProps {
  apiKey: string;
  side?: 'ida' | 'vuelta';
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

export function LeafletMap({ apiKey, side, trackedVehicleIds, isOverview }: FleetMapProps) {
  const { state } = useFleetState();
  const searchParams = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const { vehicles, focusedMiniMapId, miniMaps } = state;
  
  const instanceIdRef = useRef<string>(`leaflet-map-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const mapKeyRef = useRef<string>('');

  const isFocusMode = isOverview && focusedMiniMapId;
  const focusedGroup = isFocusMode ? miniMaps.find((m) => m.id === focusedMiniMapId) : null;

  const trackedVehicles = trackedVehicleIds?.map((id) => vehicles.find((v) => v.id_vehiculo === id)).filter(Boolean) as Vehicle[] || [];
  const isTrackingView = trackedVehicles.length > 0;
  const trackedVehicleIdsKey = trackedVehicleIds?.slice().sort((a, b) => a - b).join(',') || 'all';
  
  if (mapKeyRef.current === '') {
    mapKeyRef.current = `${isDemoMode ? 'demo' : 'live'}-${isOverview ? 'overview' : 'main'}-${side ?? 'all'}-${trackedVehicleIdsKey}-${instanceIdRef.current}`;
  }
  const mapKey = mapKeyRef.current;

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      const container = document.getElementById(mapKey);
      if (container) {
        // Clean up Leaflet instance state on unmount
        Object.keys(container).forEach(key => {
          if (key.startsWith('_leaflet')) {
            try {
              delete (container as any)[key];
            } catch (e) {
              // Ignore errors
            }
          }
        });
      }
    };
  }, [mapKey]);

  // Debug: log mount/unmount and container state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = document.getElementById(mapKey);
    console.info('LeafletMap mounted', { mapKey, hasContainer: !!container, containerId: container?.id, leafletKeys: container ? Object.keys(container).filter(k => k.startsWith('_leaflet')) : [] });
    return () => {
      console.info('LeafletMap unmount', { mapKey });
    };
  }, [mapKey]);

  if (isDemoMode) {
    return (
      <div className="w-full h-full relative bg-muted/20 flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/10">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="text-center z-10 px-6">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {isTrackingView ? `${trackedVehicles.length} Units Radar Lock` : side ? `Visor de Flota: ${side}` : isFocusMode ? `Enfocado: ${focusedGroup?.name}` : 'Visor de Flota Principal'}
          </p>
          <p className="text-xs text-muted-foreground/60 italic">[Modo Demo: Mapa Real Desactivado]</p>
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
                RADAR: {trackedVehicles.length}
              </div>
            )}
            {isFocusMode && (
              <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-white">
                FOCUS: {focusedGroup?.name}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <MapContainer
      id={mapKey}
      key={mapKey}
      center={[-12.046374, -77.042793]}
      zoom={isTrackingView || isFocusMode ? 16 : 13}
      scrollWheelZoom
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
      tap={true}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
      whenCreated={(m) => {
        try {
          (window as any).__fleet_map = m;
          if ((m as any).dragging && (m as any).dragging.enable) (m as any).dragging.enable();
        } catch (e) {
          // ignore
        }
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LeafletMapControl side={side} trackedVehicleIds={trackedVehicleIds} isOverview={isOverview} />
      {(side || isTrackingView || isFocusMode) && (
        <div className="absolute top-4 right-4 z-20 flex gap-2 pointer-events-none">
          {side && (
            <div className="bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-primary">
              {side === 'ida' ? 'Ida' : 'Vuelta'}
            </div>
          )}
          {isTrackingView && (
            <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-white">
              RADAR: {trackedVehicles.length}
            </div>
          )}
          {isFocusMode && (
            <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg text-xs font-bold uppercase tracking-widest text-white">
              FOCUS: {focusedGroup?.name}
            </div>
          )}
        </div>
      )}
    </MapContainer>
  );
}
