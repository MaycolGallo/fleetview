
"use client";

import { cn } from '@/lib/utils';
import type { VehicleStatus } from '@/lib/types';

interface VehiclePinProps {
  status: VehicleStatus;
  isSelected: boolean;
}

const statusClasses = {
  'active': 'fill-primary drop-shadow-md',
  'idle': 'fill-gray-400 drop-shadow-md',
  'out-of-service': 'fill-red-500 drop-shadow-md',
};

const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary">
        <path d="M14 16.5V14a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2.5"/>
        <path d="M14 16.5a2.5 2.5 0 1 1-5 0"/>
        <path d="M6 14H2.5v-2a2 2 0 0 1 2-2H8"/>
        <path d="M18 14h3.5v-2a2 2 0 0 0-2-2H16"/>
        <path d="M5 10l1.5-4.5A2 2 0 0 1 8.5 4h7a2 2 0 0 1 2 1.5L19 10"/>
        <path d="M5 10h14"/>
    </svg>
);


export function VehiclePin({ status, isSelected }: VehiclePinProps) {
  return (
    <div
      className={cn(
        'transition-transform duration-300 transform-gpu cursor-pointer',
        isSelected ? 'scale-125 z-10' : 'scale-100'
      )}
      style={{ filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none' }}
    >
      <div className="relative w-10 h-14">
        <svg
          viewBox="0 0 38 54"
          className={cn(
            'w-full h-full transition-colors',
            statusClasses[status]
          )}
        >
          <path d="M19 0C8.5 0 0 8.5 0 19.1C0 32.9 19 54 19 54S38 32.9 38 19.1C38 8.5 29.5 0 19 0Z" />
        </svg>
        <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-7 h-7 bg-white rounded-full flex items-center justify-center">
          <CarIcon />
        </div>
      </div>
    </div>
  );
}
