'use client';

import { Drawer, DrawerContent, DrawerHandle, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { useCallback, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { AlertCircle, Zap, ShieldAlert, Gauge, Clock, Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format, fromUnixTime } from 'date-fns';
import { cn } from '@/lib/utils';
import { Incidencia } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const typeIconMap: Record<Incidencia['type'], React.ElementType> = {
  panic: ShieldAlert,
  harsh_accel: Zap,
  harsh_brake: AlertCircle,
  speeding: Gauge,
  excessive_idle: Clock,
};

const typeColorMap: Record<Incidencia['type'], string> = {
  panic: 'bg-red-500',
  harsh_accel: 'bg-amber-500',
  harsh_brake: 'bg-orange-500',
  speeding: 'bg-red-600',
  excessive_idle: 'bg-gray-500',
};

export function IncidenciasSheet() {
  const isMobile = useIsMobile();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isIncidenciasSheetOpen, incidencias, historyVehicle, selectedIncidenciaId, lastUpdatedIncidencias } = state;
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !isIncidenciasSheetOpen) return;
    el.addEventListener('scroll', checkScroll);
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, [isIncidenciasSheetOpen, checkScroll, incidencias]);

  useEffect(() => {
    if (selectedIncidenciaId && itemRefs.current[selectedIncidenciaId]) {
        itemRefs.current[selectedIncidenciaId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
  }, [selectedIncidenciaId]);

  useEffect(() => {
    if (lastUpdatedIncidencias) {
        setJustUpdated(true);
        const t = setTimeout(() => setJustUpdated(false), 2000);
        return () => clearTimeout(t);
    }
  }, [lastUpdatedIncidencias]);

  const handleClose = useCallback(() => {
    dispatch({ type: 'CLOSE_INCIDENCIAS' });
  }, [dispatch]);

  const handleIncidenciaSelect = useCallback((id: string) => {
    dispatch({ type: 'SELECT_INCIDENCIA', payload: id });
  }, [dispatch]);

  const handleScrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  if (!isIncidenciasSheetOpen) return null;

  if (isMobile) {
    return (
        <Drawer open={isIncidenciasSheetOpen} onOpenChange={(open) => !open && handleClose()} modal={false}>
            <DrawerContent className="h-[60%] flex flex-col">
                <DrawerHandle />
                <DrawerHeader className="text-left p-4 pt-0 pb-2 flex-shrink-0">
                    <DrawerTitle>Incidencias: {historyVehicle?.placa}</DrawerTitle>
                    <DrawerDescription asChild>
                        <div className="flex flex-col gap-1">
                            <span>Timeline de eventos críticos detectados recientemente.</span>
                            {lastUpdatedIncidencias && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <RefreshCw className={cn("w-2.5 h-2.5", justUpdated && "animate-spin text-primary")} />
                                    Actualizado: {format(lastUpdatedIncidencias, 'HH:mm:ss')}
                                </div>
                            )}
                        </div>
                    </DrawerDescription>
                </DrawerHeader>
                <div className={cn("flex-1 min-h-0 transition-opacity duration-500", justUpdated ? "opacity-50" : "opacity-100")}>
                    <ScrollArea className="h-full">
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
                                        <div className={cn("p-2 rounded-full text-white", typeColorMap[inc.type])}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="font-semibold text-sm truncate">{inc.description}</p>
                                                <p className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-1.5 py-0.5 rounded font-bold">
                                                    {format(fromUnixTime(inc.timestamp), 'HH:mm')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    <span>{format(fromUnixTime(inc.timestamp), 'dd/MM/yyyy')}</span>
                                                </div>
                                            </div>
                                            {inc.value && (
                                                <div className="mt-1 text-xs font-bold text-destructive">
                                                    {inc.value}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
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
      <Card className="max-w-full mx-auto bg-card/95 backdrop-blur-md border-primary/20 shadow-2xl h-auto flex flex-col overflow-hidden">
        <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    Incidencias: {historyVehicle?.placa}
                    {lastUpdatedIncidencias && (
                        <Badge variant="secondary" className={cn("text-[10px] h-5 transition-all ml-2", justUpdated && "bg-primary/20 scale-110")}>
                            <RefreshCw className={cn("w-3 h-3 mr-1", justUpdated && "animate-spin text-primary")} />
                            {format(lastUpdatedIncidencias, 'HH:mm:ss')}
                        </Badge>
                    )}
                </h2>
                <p className="text-xs text-muted-foreground">Línea de tiempo de alertas de telemetría críticas</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClose}>Cerrar</Button>
        </CardHeader>
        
        <div className={cn("relative flex items-center h-[200px] transition-all duration-700", justUpdated && "bg-primary/5")}>
            {canScrollLeft && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-10 w-10 rounded-full shadow-lg border bg-card/90"
                        onClick={handleScrollLeft}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                </div>
            )}

            <ScrollArea className="w-full h-full" viewportRef={scrollContainerRef}>
                <div className="flex items-start p-6 pt-10 min-w-max gap-0">
                    {incidencias.map((inc, index) => {
                        const Icon = typeIconMap[inc.type];
                        const isSelected = selectedIncidenciaId === inc.id;
                        
                        return (
                            <div
                                key={inc.id}
                                ref={(el) => { itemRefs.current[inc.id] = el; }}
                                className={cn(
                                    "relative flex flex-col items-center w-[200px] cursor-pointer group transition-all",
                                    isSelected ? "scale-105" : "hover:scale-102"
                                )}
                                onClick={() => handleIncidenciaSelect(inc.id)}
                            >
                                {index < incidencias.length - 1 && (
                                    <div className="absolute top-5 left-1/2 w-full h-0.5 bg-border z-0" />
                                )}

                                <div
                                    className={cn(
                                        "z-10 flex h-10 w-10 items-center justify-center rounded-full text-white transition-all shadow-md",
                                        typeColorMap[inc.type],
                                        isSelected ? 'ring-4 ring-primary ring-offset-2' : 'ring-2 ring-white'
                                    )}
                                >
                                    <Icon className="h-6 w-6" />
                                </div>

                                <div className={cn(
                                    "mt-4 text-center p-2 rounded-lg transition-colors w-full px-4",
                                    isSelected ? "bg-primary/5 border border-primary/20" : "group-hover:bg-accent/50"
                                )}>
                                    <p className={cn(
                                        "font-bold text-xs truncate mb-1",
                                        isSelected ? 'text-primary' : 'text-foreground'
                                    )}>
                                        {inc.description}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        {format(fromUnixTime(inc.timestamp), 'HH:mm:ss')}
                                    </p>
                                    {inc.value && (
                                        <p className="text-[10px] font-bold text-destructive mt-1">
                                            {inc.value}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {canScrollRight && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-10 w-10 rounded-full shadow-lg border bg-card/90"
                        onClick={handleScrollRight}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Button>
                </div>
            )}
        </div>
      </Card>
    </div>
  );
}