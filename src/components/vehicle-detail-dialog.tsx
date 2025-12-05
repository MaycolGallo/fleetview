"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Vehicle } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface VehicleDetailDialogProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusDetails = {
    'active': {
        label: 'Active',
        variant: 'default' as const,
        icon: CheckCircle,
    },
    'idle': {
        label: 'Idle',
        variant: 'secondary' as const,
        icon: Clock,
    },
    'out-of-service': {
        label: 'Out of Service',
        variant: 'destructive' as const,
        icon: AlertCircle,
    }
};

export function VehicleDetailDialog({ vehicle, isOpen, onOpenChange }: VehicleDetailDialogProps) {
  if (!vehicle) return null;

  const details = statusDetails[vehicle.status];
  const StatusIcon = details.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Vehicle ID: {vehicle.vehicleId}</DialogTitle>
          <DialogDescription>
            Detailed telemetry information for the selected vehicle.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground w-24">Status</span>
             <Badge variant={details.variant} className="text-sm px-3 py-1">
                <StatusIcon className="w-4 h-4 mr-2" />
                {details.label}
            </Badge>
          </div>
          <div className="flex items-start gap-4 text-sm">
            <MapPin className="w-5 h-5 mt-1 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Last Known Location</p>
              <p className="text-muted-foreground">
                Latitude: {vehicle.latitude.toFixed(6)}
              </p>
              <p className="text-muted-foreground">
                Longitude: {vehicle.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
