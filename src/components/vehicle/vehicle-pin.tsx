'use client';

import { cn } from '@/lib/utils';
import type { Vehicle } from '@/lib/types';
import React from 'react';
import { Car } from 'lucide-react';

interface VehiclePinProps { vehicle: Vehicle; isSelected: boolean; isHistory?: boolean }

export const VehiclePin = React.memo(({ vehicle, isSelected, isHistory }: VehiclePinProps) => {
  const color = vehicle.statusColor || '#9E9E9E';

  if (isHistory) {
    return (
      <div className="relative flex h-6 w-6 items-center justify-center">
        <div className={cn('flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-xl transition-all duration-300', isSelected ? 'scale-110 ring-2 ring-primary/40' : 'scale-100')} style={{ backgroundColor: color, boxShadow: `0 0 0 2px white, 0 0 0 3px ${color}, inset 0 0 2px rgba(0,0,0,0.1)` }}>
          <div style={{ transform: `rotate(${vehicle.rumbo}deg)` }}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" /></svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-20 w-10 flex-col items-center overflow-visible">
      <div className="pointer-events-none absolute left-0 top-14 z-0 h-6 w-10" style={{ filter: isSelected ? 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))', transform: `rotate(${vehicle.rumbo}deg)`, transformOrigin: '20px 0' }} aria-hidden="true">
        <svg viewBox="0 0 40 24" className="block h-full w-full" aria-hidden="true">
          <path d="M20 0L37 24L20 16L3 24L20 0Z" fill={color} fillOpacity="0.9" stroke={color} strokeWidth="1" strokeLinejoin="round" />
        </svg>
      </div>

      <div className={cn('relative z-10 h-14 w-10 vehicle-pin-main transition-all duration-200', isSelected && 'scale-110')}>
        <div className="absolute left-0 top-0 h-14 w-10">
          <svg viewBox="0 0 38 54" className={cn('h-full w-full', isSelected ? 'drop-shadow-2xl' : 'drop-shadow-lg')}>
            <defs>
              <linearGradient id={`pin-gradient-${vehicle.id_vehiculo}`} x1="0" y1="0" x2="0.8" y2="1"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" /><stop offset="38%" stopColor={color} /><stop offset="100%" stopColor={color} stopOpacity="0.72" /></linearGradient>
              <filter id={`glow-${vehicle.id_vehiculo}`}><feGaussianBlur stdDeviation="2" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <path fill={`url(#pin-gradient-${vehicle.id_vehiculo})`} stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" filter={isSelected ? `url(#glow-${vehicle.id_vehiculo})` : undefined} d="M19 0C8.5 0 0 8.5 0 19.1C0 32.9 15.7 50.7 18.4 53.5C18.7 53.8 19.3 53.8 19.6 53.5C22.3 50.7 38 32.9 38 19.1C38 8.5 29.5 0 19 0Z" />
          </svg>
        </div>
        <div className={cn('absolute left-0 flex w-full justify-center transition-all duration-200', isSelected && 'ring-2 ring-white ring-offset-1')} style={{ top: '6px' }}>
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}><Car className="h-4 w-4" style={{ color }} /></div>
        </div>
      </div>
    </div>
  );
});

VehiclePin.displayName = 'VehiclePin';
