
"use client";

import type { MouseEvent } from 'react';
import type { Vehicle } from '@/lib/types';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehiclePin } from './vehicle-pin';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from "./ui/badge";
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Clock, Route } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleMarkerProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onClick: () => void;
}

export function VehicleMarker({ vehicle, isSelected, onClick }: VehicleMarkerProps) {
  
  return (
      <AdvancedMarker
          position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
          onClick={onClick}
      >
          <div className="cursor-pointer">
              <VehiclePin status={vehicle.status} isSelected={isSelected} />
          </div>
      </AdvancedMarker>
  );
}
