
'use client';

import { cn } from '@/lib/utils';
import type { Vehicle } from '@/lib/types';
import React from 'react';
import { motion } from 'framer-motion';
import { useFleet, statusDetailsMap } from '@/context/fleet-context';
import { Car, Navigation } from 'lucide-react';

interface VehiclePinProps {
  vehicle: Vehicle;
  isSelected: boolean;
}

export const VehiclePin = React.memo(({ vehicle, isSelected }: VehiclePinProps) => {
  const { state } = useFleet();
  const { pinRotationMode } = state;
  const color = statusDetailsMap[vehicle.status as keyof typeof statusDetailsMap]?.color || '#9E9E9E';

  const rotation = 0; // Temporarily disable pin rotation as requested
  
  return (
      <div className='relative w-10 h-14 flex flex-col items-center'>
          <motion.div
            className='relative w-10 h-12' // Adjusted height
            animate={{ rotate: rotation }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
              {/* Background Pin Shape */}
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
              
              {/* Centered Icon */}
               <div
                  className="absolute w-full h-full flex justify-center items-start pt-[6px]"
                >
                <div
                  className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
                >
                      <Car className="w-4 h-4" style={{ color: color }} />
                </div>
              </div>
          </motion.div>

           {/* Heading Arrow */}
          <motion.div
            className="absolute bottom-[-4px] left-1/2 -translate-x-1/2"
            style={{ originY: '50%' }}
            animate={{ rotate: vehicle.rumbo }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
              <Navigation
                className="h-5 w-5 drop-shadow-md"
                fill='black'
                stroke='white'
                strokeWidth={1.5}
              />
        </motion.div>
      </div>
  );
});

VehiclePin.displayName = 'VehiclePin';
