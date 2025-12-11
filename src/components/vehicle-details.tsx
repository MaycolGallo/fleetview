
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useFleet } from '@/context/fleet-context';
import { Badge } from './ui/badge';
import { User, Gauge, Fuel, Wrench, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

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
          <div className="text-sm text-muted-foreground">
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
          </div>
        </SheetHeader>
        <div className="py-6 space-y-6">
            <Card>
                 <CardHeader className='p-4'>
                    <CardTitle className='text-base'>Current Status</CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 pt-0 space-y-4">
                    <DetailItem icon={User} label="Driver" value={selectedVehicle.driverName} />
                    <DetailItem icon={Gauge} label="Speed" value={selectedVehicle.speedKph} unit="km/h" />
                    <div className="space-y-2">
                        <DetailItem icon={Fuel} label="Fuel Level" value={`${selectedVehicle.fuelLevel}%`} />
                        <Progress value={selectedVehicle.fuelLevel} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='p-4'>
                    <CardTitle className='text-base'>Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
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
                </CardContent>
            </Card>
            
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
