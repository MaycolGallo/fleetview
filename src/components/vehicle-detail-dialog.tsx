
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Vehicle } from "@/lib/types";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleDetailDialogProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const statusDetails = {
    'active': {
        icon: CheckCircle,
        className: 'text-green-500 bg-green-100 border-green-200',
        text: 'text-green-700'
    },
    'idle': {
        icon: Clock,
        className: 'text-amber-500 bg-amber-100 border-amber-200',
        text: 'text-amber-700'
    },
    'out-of-service': {
        icon: AlertCircle,
        className: 'text-red-500 bg-red-100 border-red-200',
        text: 'text-red-700'
    }
};

export function VehicleDetailDialog({ vehicle, isOpen, onOpenChange }: VehicleDetailDialogProps) {
  if (!vehicle) return null;
  
  const status = statusDetails[vehicle.status];
  const StatusIcon = status.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl">{vehicle.vehicleId}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className={cn("capitalize text-sm", status.className, status.text)}>
              <StatusIcon className="mr-2 h-4 w-4" />
              {vehicle.status.replace('-', ' ')}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Latitude</span>
            <span className="font-mono text-foreground">{vehicle.latitude.toFixed(6)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Longitude</span>
            <span className="font-mono text-foreground">{vehicle.longitude.toFixed(6)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
