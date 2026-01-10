

'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerPortal,
  DrawerOverlay,
  DrawerHandle
} from '@/components/ui/drawer';
import { useFleet, statusDetailsMap } from '@/context/fleet-context';
import { Badge } from './ui/badge';
import { Move, Gauge, Tag, Rss, Clock, Wind, BarChart, Battery, BatteryFull } from 'lucide-react';
import { format, fromUnixTime } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

function DetailItem({ icon: Icon, label, value, unit }: { icon: React.ElementType, label: string, value: React.ReactNode, unit?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="font-semibold text-foreground">
        {value} {unit && <span className="text-xs font-normal text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

function VehicleDetailsContent() {
    const { state, dispatch } = useFleet();
    const { selectedVehicle } = state;

    const handleSimulateMove = () => {
      if (!selectedVehicle) return;
      
      const updateAction = () => {
        dispatch({ type: 'SIMULATE_VEHICLE_MOVE', payload: selectedVehicle.id });
      };

      // @ts-ignore
      if (document.startViewTransition) {
        // @ts-ignore
        document.startViewTransition(() => {
          updateAction();
        });
      } else {
        updateAction();
      }
    };
    
    if (!selectedVehicle) return null;

    const statusDetail = statusDetailsMap[selectedVehicle.status];

    return (
       <div className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-sm border-l border-zinc-800">
           <div className="p-4">
                <h2 className="text-lg font-semibold">Placa: {selectedVehicle.placa}</h2>
                <div className="text-sm text-muted-foreground pt-1">
                    <Badge
                        className="capitalize"
                        style={{ backgroundColor: statusDetail.color, color: '#fff' }}
                    >
                        {selectedVehicle.nombre_estado}
                    </Badge>
                </div>
           </div>
           <Separator />
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <Card>
                    <CardHeader className='p-4'>
                        <CardTitle className='text-base'>Información Actual</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                        <DetailItem icon={Tag} label="ID Vehículo" value={selectedVehicle.id_vehiculo} />
                        <DetailItem icon={Gauge} label="Velocidad" value={selectedVehicle.velocidad} unit="km/h" />
                        <DetailItem icon={Rss} label="Odómetro" value={parseFloat(selectedVehicle.odometro).toLocaleString()} unit="km" />
                        <DetailItem icon={Wind} label="Rumbo" value={selectedVehicle.rumbo} unit="°" />
                         <DetailItem 
                            icon={Clock} 
                            label="Última Fecha" 
                            value={format(fromUnixTime(selectedVehicle.fecha), 'Pp')} 
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='p-4'>
                        <CardTitle className='text-base'>Batería</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                        <DetailItem 
                            icon={Battery}
                            label="GPS" 
                            value={selectedVehicle.bateria} 
                            unit="V"
                        />
                        <DetailItem 
                            icon={BatteryFull} 
                            label="Vehículo" 
                            value={selectedVehicle.bateria_vehiculo}
                            unit="V"
                        />
                    </CardContent>
                </Card>
            </div>
            <Separator />
            <div className='p-4'>
                <Button onClick={handleSimulateMove} className="w-full">
                    <Move className="mr-2 h-4 w-4" /> Simular Movimiento
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
  
  const statusDetail = statusDetailsMap[selectedVehicle.status];

  const handleSimulateMove = () => {
    if (!selectedVehicle) return;

    const updateAction = () => {
      dispatch({ type: 'SIMULATE_VEHICLE_MOVE', payload: selectedVehicle.id });
    };

    // @ts-ignore
    if (document.startViewTransition) {
      // @ts-ignore
      document.startViewTransition(() => {
        updateAction();
      });
    } else {
      updateAction();
    }
  };

  if (isMobile) {
    return (
        <Drawer open={!!selectedVehicle} onOpenChange={handleOpenChange} snapPoints={[0.6, 1]} activeSnapPoint={0.6}>
            <DrawerPortal>
                <DrawerOverlay className="bg-transparent" />
                <DrawerContent className='bg-zinc-900/95 backdrop-blur-sm mt-0'>
                    <div className="p-4 overflow-auto h-[60vh]">
                        <DrawerHandle className="mb-4" />
                        <DrawerHeader className='p-0 text-left'>
                            <DrawerTitle>Placa: {selectedVehicle.placa}</DrawerTitle>
                             <div className="text-sm text-muted-foreground pt-1">
                                <Badge
                                    className="capitalize"
                                    style={{ backgroundColor: statusDetail.color, color: '#fff' }}
                                >
                                    {selectedVehicle.nombre_estado}
                                </Badge>
                            </div>
                        </DrawerHeader>
                        <div className="py-6 space-y-4">
                            <Card>
                                <CardHeader className='p-4'>
                                    <CardTitle className='text-base'>Información Actual</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-3">
                                    <DetailItem icon={Tag} label="ID Vehículo" value={selectedVehicle.id_vehiculo} />
                                    <DetailItem icon={Gauge} label="Velocidad" value={selectedVehicle.velocidad} unit="km/h" />
                                    <DetailItem icon={Rss} label="Odómetro" value={parseFloat(selectedVehicle.odometro).toLocaleString()} unit="km" />
                                    <DetailItem icon={Wind} label="Rumbo" value={selectedVehicle.rumbo} unit="°" />
                                    <DetailItem 
                                        icon={Clock} 
                                        label="Última Fecha" 
                                        value={format(fromUnixTime(selectedVehicle.fecha), 'Pp')} 
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className='p-4'>
                                    <CardTitle className='text-base'>Batería</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-3">
                                    <DetailItem 
                                        icon={Battery}
                                        label="GPS" 
                                        value={selectedVehicle.bateria} 
                                        unit="V"
                                    />
                                    <DetailItem 
                                        icon={BatteryFull} 
                                        label="Vehículo" 
                                        value={selectedVehicle.bateria_vehiculo}
                                        unit="V"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                         <Button onClick={handleSimulateMove} className="w-full">
                            <Move className="mr-2 h-4 w-4" /> Simular Movimiento
                        </Button>
                    </div>
                </DrawerContent>
            </DrawerPortal>
        </Drawer>
    )
  }

  return (
    <VehicleDetailsContent />
  );
}
