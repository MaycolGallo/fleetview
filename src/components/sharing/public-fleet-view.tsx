
'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useFleetState } from '@/context/fleet-context';
import { Skeleton } from '../ui/skeleton';
import { ShieldCheck, Clock, AlertTriangle, Car } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';

const FleetMap = dynamic(() => import('../fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-screen w-screen" />,
});

interface PublicFleetViewProps {
  apiKey: string;
  token: string;
}

interface SharePayload {
  ids: number[];
  exp: number;
}

export function PublicFleetView({ apiKey, token }: PublicFleetViewProps) {
  const { state } = useFleetState();
  const { vehicles } = state;

  const { payload, isExpired } = useMemo(() => {
    try {
      const decoded = JSON.parse(atob(token)) as SharePayload;
      return {
        payload: decoded,
        isExpired: Date.now() > decoded.exp
      };
    } catch (e) {
      console.error("Invalid share token", e);
      return { payload: null, isExpired: true };
    }
  }, [token]);

  const sharedVehicles = useMemo(() => {
    if (!payload) return [];
    return vehicles.filter(v => payload.ids.includes(v.id_vehiculo));
  }, [vehicles, payload]);

  if (isExpired) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-muted/10 p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl border shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold">Enlace Expirado</h1>
          <p className="text-muted-foreground text-sm">
            Este enlace de rastreo ha expirado o no es válido.
          </p>
        </div>
      </div>
    );
  }

  if (!payload) return <Skeleton className="h-screen w-screen" />;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <main className="absolute inset-0 z-0">
        <FleetMap 
          apiKey={apiKey} 
          manualVehicleIds={payload.ids} 
          isMainMap={false} 
        />
      </main>

      <div className="absolute top-6 left-6 right-6 z-10 flex flex-col items-center pointer-events-none">
        <div className="bg-card/90 backdrop-blur-md border border-primary/20 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 pointer-events-auto">
          <div className="p-1.5 bg-primary/10 rounded-full">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-none">Rastreo Compartido</span>
            <span className="text-[10px] text-muted-foreground font-medium">Solo Lectura</span>
          </div>
          <div className="h-6 w-px bg-border mx-1" />
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Expira en: {formatDistanceToNow(payload.exp)}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
         <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-4 w-64 pointer-events-auto space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
               <Car className="w-4 h-4 text-primary" />
               <span className="text-xs font-bold uppercase tracking-wider">Unidades en Vista</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
               {sharedVehicles.map(v => (
                 <div key={v.id_vehiculo} className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/30">
                    <span className="font-bold">{v.placa}</span>
                    <Badge 
                      variant="outline" 
                      className="text-[10px] text-white border-none"
                      style={{ backgroundColor: v.statusColor }}
                    >
                      {v.statusName}
                    </Badge>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="absolute bottom-6 right-6 z-10 pointer-events-none opacity-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1 rounded">
             <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black tracking-tighter text-foreground">FleetView</span>
        </div>
      </div>
    </div>
  );
}
