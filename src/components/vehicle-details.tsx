
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useFleet } from '@/context/fleet-context';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { User, Gauge, Fuel, Wrench, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

function DetailItem({ icon: Icon, label, value, unit }: { icon: React.ElementType, label: string, value: React.ReactNode, unit?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="font-semibold text-foreground">
        {value} {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

export function VehicleDetails() {
  const { state, dispatch } = useFleet();
  const { selectedVehicle } = state;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      dispatch({ type: 'SELECT_VEHICLE', payload: null });
    }
  };

  if (!selectedVehicle) {
    return null;
  }

  const isOutofService = selectedVehicle.status === 'out-of-service';

  return (
    <Sheet open={!!selectedVehicle} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>{selectedVehicle.vehicleId}</SheetTitle>
          <SheetDescription>
            <Badge
              variant={
                selectedVehicle.status === 'active'
                  ? 'default'
                  : selectedVehicle.status === 'idle'
                  ? 'secondary'
                  : 'destructive'
              }
              className="capitalize"
            >
              {selectedVehicle.status.replace('-', ' ')}
            </Badge>
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-6">
            <div className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                 <h3 className="font-semibold leading-none tracking-tight">Current Status</h3>
                 <Separator />
                <DetailItem icon={User} label="Driver" value={selectedVehicle.driverName} />
                <DetailItem icon={Gauge} label="Speed" value={selectedVehicle.speedKph} unit="km/h" />
                <div className="space-y-2">
                    <DetailItem icon={Fuel} label="Fuel Level" value={`${selectedVehicle.fuelLevel}%`} />
                    <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${selectedVehicle.fuelLevel}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                 <h3 className="font-semibold leading-none tracking-tight">Maintenance</h3>
                 <Separator />
                <DetailItem 
                    icon={Wrench} 
                    label="Last Service" 
                    value={format(new Date(selectedVehicle.lastMaintenance), 'PPP')} 
                />
                 <DetailItem 
                    icon={Calendar} 
                    label="Time since" 
                    value={formatDistanceToNow(new Date(selectedVehicle.lastMaintenance), { addSuffix: true })}
                />
            </div>
            
            {isOutofService && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive p-4 text-sm">
                    This vehicle is currently out of service. Speed and location data may not be up-to-date.
                </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
