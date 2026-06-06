
'use client';

/**
 * @fileOverview Shared tactical UI for vehicle information popups.
 * Used consistently across Google Maps, Leaflet, and Mapbox.
 */

import React from 'react';
import type { Vehicle } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format, fromUnixTime } from 'date-fns';
import { Gauge, Zap, Wifi, Clock, Navigation } from 'lucide-react';

export function VehicleMapPopupContent({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="p-1 min-w-[220px] space-y-3 antialiased">
      <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-1">
        <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm" style={{ backgroundColor: vehicle.statusColor }} />
            <span className="font-bold text-sm tracking-tight">{vehicle.placa}</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 h-5 font-bold uppercase tracking-wider bg-muted/50 border-primary/20">
          {vehicle.statusName}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="w-3.5 h-3.5 text-primary/70" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Velocidad</span>
        </div>
        <div className="text-[11px] font-bold text-right">
            {parseFloat(vehicle.velocidad).toFixed(0)} <span className="text-[9px] font-normal text-muted-foreground">km/h</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
            <Navigation className="w-3.5 h-3.5 text-primary/70" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Odómetro</span>
        </div>
        <div className="text-[11px] font-bold text-right text-nowrap">
            {parseFloat(vehicle.odometro).toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">km</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="w-3.5 h-3.5 text-amber-500/80" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Batería</span>
        </div>
        <div className="text-[11px] font-bold text-right">
            {vehicle.nivel_bateria_vehicular} <span className="text-[9px] font-normal text-muted-foreground">V</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
            <Wifi className="w-3.5 h-3.5 text-primary/70" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Señal GSM</span>
        </div>
        <div className="text-[11px] font-bold text-right">
            {vehicle.senal_gsm}
        </div>
      </div>

      <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[9px] text-muted-foreground/80">
        <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{format(fromUnixTime(vehicle.fecha), 'HH:mm:ss')}</span>
        </div>
        <span className="font-mono text-[8px] opacity-60 uppercase">Unit: {vehicle.id_vehiculo}</span>
      </div>
    </div>
  );
}
