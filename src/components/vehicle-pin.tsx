

'use client';

import { cn } from '@/lib/utils';
import type { Vehicle, VehicleStatus } from '@/lib/types';
import React from 'react';
import { motion } from 'framer-motion';
import { useFleet, statusDetailsMap } from '@/context/fleet-context';

interface VehiclePinProps {
  vehicle: Vehicle;
  isSelected: boolean;
}

export const VehiclePin = React.memo(({ vehicle, isSelected }: VehiclePinProps) => {
  const { state } = useFleet();
  const { pinRotationMode } = state;
  const color = statusDetailsMap[vehicle.status as keyof typeof statusDetailsMap]?.color || '#9E9E9E';

  const isTeardrop = isSelected || vehicle.status === '3';
  
  if (isTeardrop) {
    const rotation = pinRotationMode === 'pin' ? vehicle.rumbo : 0;
    return (
        <motion.div
          className='relative w-10 h-14'
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
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
            <motion.div 
              className="absolute inset-0 flex items-center justify-center top-[-7px]"
              animate={{ rotate: -rotation }}
            >
                <span className='font-bold text-white text-sm drop-shadow-sm'>{vehicle.velocidad}</span>
            </motion.div>
        </motion.div>
    );
  }

  // Circular marker
  return (
    <div className='relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg' style={{ backgroundColor: color }}>
        <span className='font-bold text-white text-xs drop-shadow-sm'>{vehicle.velocidad}</span>
    </div>
  );
});

VehiclePin.displayName = 'VehiclePin';
