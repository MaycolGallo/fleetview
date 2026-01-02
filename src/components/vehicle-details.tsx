
'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerPortal,
  DrawerOverlay
} from '@/components/ui/drawer';
import { useFleet } from '@/context/fleet-context';
import { Badge } from './ui/badge';
import { User, Gauge, Fuel, Wrench, Calendar, Move } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

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

function VehicleDetailsContent() {
    const { state, dispatch } = useFleet();
    const { selectedVehicle } = state;

    const handleSimulateMove = () => {
      if (selectedVehicle) {
        dispatch({ type: 'SIMULATE_VEHICLE_MOVE', payload: selectedVehicle.id });
      }
    };
    
    if (!selectedVehicle) return null;

    const isOutofService = selectedVehicle.status === 'out-of-service';

    return (
       <div className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-sm border-l border-zinc-800">
           <div className="p-4">
                <h2 className="text-lg font-semibold">{selectedVehicle.id}</h2>
                <div className="text-sm text-muted-foreground pt-1">
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
           </div>
           <Separator />
            <div className="p-4 space-y-6 overflow-y-auto flex-1">
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
            <Separator />
            <div className='p-4'>
                <Button onClick={handleSimulateMove} className="w-full">
                    <Move className="mr-2 h-4 w-4" /> Simulate Move
                </Button>
            </div>
        </div>
    )
}

export function VehicleDetails() {
  const { state, dispatch } = useFleet();
  const { selectedVehicle } = state;
  const isMobile = useIsMobile();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      dispatch({ type: 'PAN_TO_VEHICLE', payload: null });
    }
  };

  if (!selectedVehicle) {
    return null;
  }

  if (isMobile) {
    return (
        <Drawer.Root open={!!selectedVehicle} onOpenChange={handleOpenChange} snapPoints={[0.5, 1]} activeSnapPoint={0.5}>
            <DrawerPortal>
                <DrawerOverlay className="bg-transparent" />
                <Drawer.Content className='bg-zinc-900/95 backdrop-blur-sm mt-0'>
                    <div className="p-4 overflow-auto h-[50vh]">
                        <Drawer.Handle className="mb-4" />
                        <DrawerHeader className='p-0 text-left'>
                            <DrawerTitle>{selectedVehicle.id}</DrawerTitle>
                        </DrawerHeader>
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
                        </div>
                         <Button onClick={() => dispatch({ type: 'SIMULATE_VEHICLE_MOVE', payload: selectedVehicle.id })} className="w-full">
                            <Move className="mr-2 h-4 w-4" /> Simulate Move
                        </Button>
                    </div>
                </Drawer.Content>
            </DrawerPortal>
        </Drawer.Root>
    )
  }

  return (
    <VehicleDetailsContent />
  );
}

    