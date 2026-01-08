
'use client';

import { cn } from '@/lib/utils';
import type { VehicleStatus } from '@/lib/types';
import React from 'react';
import { motion } from 'framer-motion';
import { useFleet, statusDetailsMap } from '@/context/fleet-context';

interface VehiclePinProps {
  status: VehicleStatus;
  isSelected: boolean;
  rumbo: number;
}

export const VehiclePin = React.memo(({ status, isSelected, rumbo }: VehiclePinProps) => {
  const { state } = useFleet();
  const { pinRotationMode } = state;
  const color = statusDetailsMap[status]?.color || '#9E9E9E';

  const showArrow = pinRotationMode === 'arrow';
  const pinRotate = pinRotationMode === 'pin' ? rumbo : 0;
  
  return (
    <div
      className={cn('transform-origin-bottom relative')}
      style={{ transformOrigin: '50% 100%'}}
    >
      <div
        className="relative w-10 h-14"
      >
        <div className="relative w-10 h-14 flex items-center justify-center">
            <svg
            viewBox="0 0 38 54"
            className="w-full h-full drop-shadow-lg absolute inset-0"
            >
            <path 
                fill={color}
                d="M19 0C8.5 0 0 8.5 0 19.1C0 32.9 19 54 19 54S38 32.9 38 19.1C38 8.5 29.5 0 19 0Z" 
            />
            </svg>
            <motion.div 
              className="relative z-10 w-7 h-7 bg-card rounded-full flex items-center justify-center top-[-7px]"
              animate={{ rotate: -pinRotate }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-card-foreground">
                    <path d="M14 16.5V14a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2.5"/>
                    <path d="M14 16.5a2.5 2.5 0 1 1-5 0"/>
                    <path d="M6 14H2.5v-2a2 2 0 0 1 2-2H8"/>
                    <path d="M18 14h3.5v-2a2 2 0 0 0-2-2H16"/>
                    <path d="M5 10l1.5-4.5A2 2 0 0 1 8.5 4h7a2 2 0 0 1 2 1.5L19 10"/>
                    <path d="M5 10h14"/>
                </svg>
            </motion.div>
        </div>
      </div>

      {showArrow && (
        <div 
          className="absolute bottom-[-8px] left-1/2 w-0 h-0 transition-transform duration-300"
          style={{ transform: `translateX(-50%) translateY(4px) rotate(${rumbo}deg)` }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" className="transform -translate-x-1/2 -translate-y-1/2">
              <path d="M10 0 L20 20 L10 15 L0 20 Z" fill={color} className="drop-shadow-lg" />
          </svg>
        </div>
      )}
    </div>
  );
});

VehiclePin.displayName = 'VehiclePin';
