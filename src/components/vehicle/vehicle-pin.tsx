'use client';

import { cn } from '@/lib/utils';
import type { Vehicle } from '@/lib/types';
import React from 'react';
import { Car } from 'lucide-react';

interface VehiclePinProps {
  vehicle: Vehicle;
  isSelected: boolean;
  isHistory?: boolean;
}

export const VehiclePin = React.memo(({ vehicle, isSelected, isHistory }: VehiclePinProps) => {
  const color = vehicle.statusColor || '#9E9E9E';
  
  if (isHistory) {
    return (
      <div className='relative w-6 h-6 flex items-center justify-center'>
        <div 
          className={cn(
            "w-6 h-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all duration-300",
            isSelected ? "ring-2 ring-primary/40 scale-110" : "scale-100"
          )}
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 0 2px white, 0 0 0 3px ${color}, inset 0 0 2px rgba(0,0,0,0.1)`
          }}
        >
          {/* Custom high-precision arrow pointing straight UP at 0 degrees */}
          <div 
            style={{ transform: `rotate(${vehicle.rumbo}deg)` }}
            className="flex items-center justify-center"
          >
            <svg 
                viewBox="0 0 24 24" 
                className="w-3.5 h-3.5 fill-white"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }
  
  return (
      <div className='relative h-20 w-10 flex flex-col items-center'>
          {/* Main Pin */}
          <div
            className={cn(
              'relative z-10 w-10 h-12 vehicle-pin-main transition-all duration-200',
              isSelected && 'scale-110'
            )}
          >
              <div className="absolute top-0 left-0 w-10 h-12">
                 <svg
                    viewBox="0 0 38 54"
                    className={cn(
                      "w-full h-full",
                      isSelected ? "drop-shadow-2xl" : "drop-shadow-lg"
                    )}
                  >
                  <defs>
                    <linearGradient id={`pin-gradient-${vehicle.id_vehiculo}`} x1="0" y1="0" x2="0.8" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
                      <stop offset="38%" stopColor={color} stopOpacity="1" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.72" />
                    </linearGradient>
                    <filter id={`glow-${vehicle.id_vehiculo}`}>
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                      fill={`url(#pin-gradient-${vehicle.id_vehiculo})`}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      filter={isSelected ? `url(#glow-${vehicle.id_vehiculo})` : undefined}
                      d="M19 0C8.5 0 0 8.5 0 19.1C0 32.9 15.7 50.7 18.4 53.5C18.7 53.8 19.3 53.8 19.6 53.5C22.3 50.7 38 32.9 38 19.1C38 8.5 29.5 0 19 0Z"
                  />
                </svg>
              </div>
              
               <div
                  className={cn(
                    "absolute left-0 w-full flex justify-center transition-all duration-200",
                    isSelected && 'ring-2 ring-white ring-offset-1'
                  )}
                  style={{ top: '6px' }}
                >
                <div
                  className="w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200"
                  style={{ boxShadow: `inset 0 1px 3px rgba(0,0,0,0.1)` }}
                >
                      <Car className="w-4 h-4" style={{ color: color }} />
                </div>
              </div>
          </div>

          {/* Ground-facing heading indicator. Keep the original narrow SVG silhouette and
              apply the perspective in CSS so it stays attached to the pin while rotating. */}
          <div
            className="pointer-events-none absolute left-1/2 top-[50px] z-0 h-8 w-4 -translate-x-1/2 transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-50%) rotate(${vehicle.rumbo}deg) rotateX(58deg)`,
              transformOrigin: '50% 0%',
              perspective: '90px',
              filter: isSelected
                ? 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))'
                : 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
            }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 16 28" className="h-full w-full overflow-visible">
              <path
                d="M8 1 C9.8 5.5 13.5 17.5 12.4 23 C11.8 26 9.8 27 8 27 C6.2 27 4.2 26 3.6 23 C2.5 17.5 6.2 5.5 8 1Z"
                fill={color}
                fillOpacity="0.5"
              />
              <path
                d="M8 3 C9.2 8 10.7 16 10.4 20"
                fill="none"
                stroke="white"
                strokeOpacity="0.28"
                strokeLinecap="round"
                strokeWidth="1"
              />
            </svg>
          </div>
      </div>
  );
});

VehiclePin.displayName = 'VehiclePin';
