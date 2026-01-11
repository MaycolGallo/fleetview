
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

  const rotation = 0;
  
  return (
      <div className='relative w-10 h-14 flex flex-col items-center'>
          {/* Main Pin */}
          <motion.div
            className='relative w-10 h-12'
            animate={{ rotate: rotation }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
                className="absolute w-full h-full flex justify-center items-start"
                style={{ top: '6px' }}
              >
                <div className="relative w-6 h-6 flex items-center justify-center bg-white rounded-full">
                   <motion.div
                      className='w-full h-full'
                      animate={{ rotate: vehicle.rumbo }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                              d="M2 13L12 2L22 13L12 9L2 13Z"
                              fill={color}
                              stroke="white"
                              strokeWidth="0.75"
                              strokeLinejoin="round"
                            />
                        </svg>
                    </motion.div>
                </div>
              </div>
          </motion.div>
      </div>
  );
});

VehiclePin.displayName = 'VehiclePin';
