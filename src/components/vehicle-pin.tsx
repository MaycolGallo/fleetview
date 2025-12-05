"use client";

import { TruckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VehicleStatus } from '@/lib/types';

interface VehiclePinProps {
  status: VehicleStatus;
  isSelected: boolean;
}

export function VehiclePin({ status, isSelected }: VehiclePinProps) {
  const statusClasses = {
    'active': 'text-accent',
    'idle': 'text-muted-foreground/80',
    'out-of-service': 'text-destructive',
  };

  return (
    <div
      className={cn(
        'p-2 bg-card rounded-full shadow-lg cursor-pointer transition-all duration-300 transform-gpu',
        'hover:scale-125 hover:z-10',
        statusClasses[status],
        isSelected ? 'scale-125 ring-2 ring-offset-2 ring-offset-background ring-primary' : 'scale-100'
      )}
      aria-label={`Vehicle, status: ${status}`}
    >
      <TruckIcon className="w-6 h-6" />
    </div>
  );
}
