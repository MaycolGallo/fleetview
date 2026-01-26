
'use client';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Clock, Milestone, ParkingSquare, Truck } from 'lucide-react';
import React from 'react';

interface EventMarkerProps {
    position: { lat: number; lng: number };
    duration: number;
    status: number;
    color: string;
}

const statusIconMap: { [key: number]: React.ElementType } = {
    4: Clock, // Ralenti
    5: ParkingSquare, // Estacionado
    6: Truck, // Transitando
};


function formatDuration(minutes: number) {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds}s`;
  }
  
  const totalMinutes = Math.round(minutes);
  if (totalMinutes < 60) {
      return `${totalMinutes}m`;
  }

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  
  let result = `${h}h`;
  if (m > 0) {
    result += ` ${m}m`;
  }
  return result;
}

export function EventMarker({ position, duration, status, color }: EventMarkerProps) {
    const Icon = statusIconMap[status] || Milestone;

    return (
        <AdvancedMarker position={position} zIndex={2}>
            <div className="flex flex-col items-center" style={{ transform: 'translate(15px, -15px)' }}>
                {/* The label with duration */}
                <div className="bg-card/80 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-md mb-1 whitespace-nowrap">
                    {formatDuration(duration)}
                </div>
                 {/* The icon marker */}
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-card"
                    style={{ backgroundColor: color }}
                >
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
        </AdvancedMarker>
    );
}
