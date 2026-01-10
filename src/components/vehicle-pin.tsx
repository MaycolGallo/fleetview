
'use client';

import { cn } from '@/lib/utils';
import type { Vehicle } from '@/lib/types';
import React from 'react';
import { motion } from 'framer-motion';
import { useFleet, statusDetailsMap } from '@/context/fleet-context';
import { Car, ArrowUp } from 'lucide-react';

interface VehiclePinProps {
  vehicle: Vehicle;
  isSelected: boolean;
}

export const VehiclePin = React.memo(({ vehicle, isSelected }: VehiclePinProps) => {
  const { state } = useFleet();
  const { pinRotationMode } = state;
  const color = statusDetailsMap[vehicle.status as keyof typeof statusDetailsMap]?.color || '#9E9E9E';

  const rotation = pinRotationMode === 'pin' ? vehicle.rumbo : 0;
  
  return (
      <div className='relative w-10 h-14 flex flex-col items-center'>
          <motion.div
            className='relative w-10 h-10'
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
              
              {/* Centered Icon with counter-rotation */}
              <div
                className="absolute left-0 w-10 flex justify-center"
                style={{ top: '6px' }}
              >
                <motion.div 
                  className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
                  animate={{ rotate: -rotation }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                      <Car className="w-4 h-4" style={{ color: color }} />
                </motion.div>
              </div>
          </motion.div>

           {/* Heading Arrow */}
            <motion.div
              className="absolute bottom-0"
              style={{ originY: '115%' }}
              animate={{ rotate: vehicle.rumbo }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <ArrowUp
                className="h-5 w-5 text-white bg-slate-800 rounded-full p-0.5 shadow-lg border border-slate-600"
              />
          </motion.div>
      </div>
  );
});

VehiclePin.displayName = 'VehiclePin';
