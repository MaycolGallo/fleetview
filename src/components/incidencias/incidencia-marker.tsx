
'use client';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { AlertCircle, Zap, ShieldAlert, Gauge, Clock } from 'lucide-react';
import React from 'react';
import { Incidencia } from '@/lib/types';
import { cn } from '@/lib/utils';

interface IncidenciaMarkerProps {
    incidencia: Incidencia;
    isSelected: boolean;
    onClick: () => void;
}

const typeIconMap: Record<Incidencia['type'], React.ElementType> = {
  panic: ShieldAlert,
  harsh_accel: Zap,
  harsh_brake: AlertCircle,
  speeding: Gauge,
  excessive_idle: Clock,
};

const typeColorMap: Record<Incidencia['type'], string> = {
  panic: '#EF4444', // Red
  harsh_accel: '#F59E0B', // Amber
  harsh_brake: '#F97316', // Orange
  speeding: '#DC2626', // Strong Red
  excessive_idle: '#6B7280', // Gray
};

export function IncidenciaMarker({ incidencia, isSelected, onClick }: IncidenciaMarkerProps) {
    const Icon = typeIconMap[incidencia.type];
    const color = typeColorMap[incidencia.type];

    return (
        <AdvancedMarker 
            position={{ lat: incidencia.lat, lng: incidencia.lng }} 
            zIndex={isSelected ? 10 : 5}
            onClick={onClick}
        >
            <div className="flex flex-col items-center group">
                {/* Tooltip on hover or selection */}
                <div className={cn(
                    "bg-card/90 backdrop-blur-sm text-foreground text-[10px] font-bold px-2 py-1 rounded-md shadow-md mb-1 whitespace-nowrap transition-all duration-300",
                    isSelected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                )}>
                    {incidencia.description}
                    {incidencia.value && <span className="ml-1 text-primary">({incidencia.value})</span>}
                </div>
                
                <div
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform duration-300",
                        isSelected ? "scale-125 ring-4 ring-primary/30" : "scale-100 hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                >
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </AdvancedMarker>
    );
}
