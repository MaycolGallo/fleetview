'use client';

import { cn } from '@/lib/utils';
import type { Vehicle } from '@/lib/types';
import React from 'react';
import { motion } from 'framer-motion';
import { useFleet, statusDetailsMap } from '@/context/fleet-context';
import { Car } from 'lucide-react';

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
      <motion.div
        className={cn(
          'w-10 h-14 relative flex items-center justify-center',
        )}
        animate={{ rotate: rotation }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <div
            className={cn(
                "absolute transition-colors duration-300",
            )}
            style={{
                width: 0,
                height: 0,
                borderLeft: '18px solid transparent',
                borderRight: '18px solid transparent',
                borderTop: `28px solid ${color}`,
                top: '18px',
                borderRadius: '5px',
            }}
        />
        <div
            className={cn(
                "absolute w-9 h-9 rounded-full transition-colors duration-300",
                "flex items-center justify-center"
            )}
            style={{ 
                backgroundColor: color,
                top: 0
            }}
        >
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                <Car className="w-5 h-5" style={{ color: color }}/>
            </div>
        </div>
        <div 
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{ bottom: 0 }}
        />
      </motion.div>
  );
});

VehiclePin.displayName = 'VehiclePin';
