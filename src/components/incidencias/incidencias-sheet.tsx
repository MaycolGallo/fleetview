
'use client';

import { Drawer, DrawerContent, DrawerHandle, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { AlertCircle, Zap, ShieldAlert, Gauge, Clock, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, fromUnixTime } from 'date-fns';
import { cn } from '@/lib/utils';
import { Incidencia } from '@/lib/types';

const typeIconMap: Record<Incidencia['type'], React.ElementType> = {
  panic: ShieldAlert,
  harsh_accel: Zap,
  harsh_brake: AlertCircle,
  speeding: Gauge,
  excessive_idle: Clock,
};

const typeColorMap: Record<Incidencia['type'], string> = {
  panic: 'text-red-500',
  harsh_accel: 'text-amber-500',
  harsh_brake: 'text-orange-500',
  speeding: 'text-red-600',
  excessive_idle: 'text-gray-500',
};

export function IncidenciasSheet() {
  const isMobile = useIsMobile();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isIncidenciasSheetOpen, incidencias, historyVehicle, selectedIncidenciaId } = state;

  const handleClose = useCallback(() => {
    dispatch({ type: 'CLOSE_INCIDENCIAS' });
  }, [dispatch]);

  const handleIncidenciaSelect = useCallback((id: string) => {
    dispatch({ type: 'SELECT_INCIDENCIA', payload: id });
  }, [dispatch]);

  if (!isIncidenciasSheetOpen) return null;

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
        <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
                {incidencias.map((inc) => {
                    const Icon = typeIconMap[inc.type];
                    const isSelected = selectedIncidenciaId === inc.id;
                    return (
                        <div 
                            key={inc.id}
                            onClick={() => handleIncidenciaSelect(inc.id)}
                            className={cn(
                                "flex items-start gap-4 p-3 rounded-lg border transition-all cursor-pointer",
                                isSelected ? "bg-accent border-primary ring-1 ring-primary/20 scale-[1.02]" : "bg-card hover:bg-accent border-border"
                            )}
                        >
                            <div className={cn("p-2 rounded-full bg-background border", typeColorMap[inc.type])}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <p className="font-semibold text-sm truncate">{inc.description}</p>
                                    <p className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                                        {format(fromUnixTime(inc.timestamp), 'HH:mm:ss')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <CalendarIcon className="w-3 h-3" />
                                        <span>{format(fromUnixTime(inc.timestamp), 'dd/MM/yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <MapPin className="w-3 h-3" />
                                        <span>{inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}</span>
                                    </div>
                                </div>
                                {inc.value && (
                                    <div className="mt-2 text-xs font-bold text-destructive flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Valor detectado: {inc.value}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
        <Drawer open={isIncidenciasSheetOpen} onOpenChange={(open) => !open && handleClose()} modal={false}>
            <DrawerContent className="h-[60%] flex flex-col">
                <DrawerHandle />
                <DrawerHeader className="text-left p-4 pt-0 pb-2 flex-shrink-0">
                    <DrawerTitle>Incidencias: {historyVehicle?.placa}</DrawerTitle>
                    <DrawerDescription>
                        Timeline de eventos críticos detectados en las últimas 24h.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="flex-1 min-h-0">
                  {content}
                </div>
            </DrawerContent>
      </Drawer>
    )
  }

  return (
    <div
      style={{ viewTransitionName: 'route-sheet-transition' }}
      className="absolute bottom-4 left-4 right-4 z-20"
    >
      <Card className="max-w-2xl mx-auto bg-card/95 backdrop-blur-md border-primary/20 shadow-2xl h-[400px] flex flex-col overflow-hidden">
        <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    Incidencias: {historyVehicle?.placa}
                </h2>
                <p className="text-xs text-muted-foreground">Listado cronológico de alertas de telemetría</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClose}>Cerrar</Button>
        </CardHeader>
        <div className="flex-1 overflow-hidden">
            {content}
        </div>
      </Card>
    </div>
  );
}
