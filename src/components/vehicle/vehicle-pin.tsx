
'use client';

import { cn } from '@/lib/utils';
import type { Vehicle } from '@/lib/types';
import React from 'react';
import { Car, Navigation } from 'lucide-react';

interface VehiclePinProps {
  vehicle: Vehicle;
  isSelected: boolean;
  isHistory?: boolean;
}

export const VehiclePin = React.memo(({ vehicle, isSelected, isHistory }: VehiclePinProps) => {
  const color = vehicle.statusColor || '#9E9E9E';
  
  if (isHistory) {
    return (
      <div className='relative w-10 h-10 flex items-center justify-center'>
        <div 
          className={cn(
            "w-10 h-10 rounded-full border-[3px] border-white shadow-2xl flex items-center justify-center transition-all duration-300",
            isSelected ? "ring-4 ring-primary/30 scale-110" : "scale-100"
          )}
          style={{ backgroundColor: color }}
        >
          <div 
            style={{ transform: `rotate(${vehicle.rumbo}deg)` }}
            className="flex items-center justify-center"
          >
            <Navigation 
              className="w-5 h-5 text-white fill-white" 
              strokeWidth={2.5}
            />
          </div>
        </div>
      </div>
    );
  }
  
  return (
      <div className='relative w-10 h-14 flex flex-col items-center'>
          {/* Main Pin */}
          <div
            className='relative w-10 h-12 vehicle-pin-main'
          >
              <div className="absolute top-0 left-0 w-10 h-12">
                 <svg
                    viewBox="0 0 38 54"
                    className="w-full h-full drop-shadow-lg"
                  >
                  <path 
                      fill={color}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      d="M19 0C8.5 0 0 8.5 0 19.1C0 32.9 19 54 19 54S38 32.9 38 19.1C38 8.5 29.5 0 19 0Z" 
                  />
                </svg>
              </div>
              
               <div
                  className="absolute left-0 w-full flex justify-center"
                  style={{ top: '6px' }}
                >
                <div
                  className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
                >
                      <Car className="w-4 h-4" style={{ color: color }} />
                </div>
              </div>
          </div>

           {/* Heading Arrow */}
          <div className="absolute bottom-[-10px] w-full h-full flex justify-center items-end">
              <div
                className='vehicle-pin-arrow'
                style={{
                    transform: `rotate(${vehicle.rumbo}deg) translateY(4px)`
                }}
              >
                  <Navigation
                    className="h-5 w-5 drop-shadow-md"
                    fill='black'
                    stroke='white'
                    strokeWidth={1.5}
                  />
            </div>
        </div>
      </div>
  );
});

VehiclePin.displayName = 'VehiclePin';
