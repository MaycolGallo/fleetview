'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { RouteHistorySheet } from './route/route-history-sheet';
import { IncidenciasSheet } from './incidencias/incidencias-sheet';
import { Button } from './ui/button';
import { 
  ArrowLeft, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  X, 
  Radar,
  Car,
  Settings2,
  Moon,
  Sun,
  Columns2,
  Rows2,
  Trash2
} from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { fromUnixTime } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { DateRangePicker } from '@/components/route/date-range-picker';
import { VehiclePanelContent } from '@/components/vehicle/vehicle-panel-content';
import { MiniMapManagementContent } from '@/components/minimap/minimap-management-content';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';
import { cn } from '@/lib/utils';

const FleetMap = dynamic(() => import('./fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

interface FleetViewClientProps {
  apiKey: string;
}

type PanelType = 'vehicles' | 'minimaps' | 'settings' | null;

export function FleetViewClient({ apiKey }: FleetViewClientProps) {
  const { state, error } = useFleetState();
  const dispatch = useFleetDispatch();
  const isMobile = useIsMobile();
  const [activePanel, setActivePanel] = useState<PanelType>('vehicles');
  const [nestedDrawerOpen, setNestedDrawerOpen] = useState(false);

  const {
    historyVehicle,
    routeGroups,
    isSplitView,
    splitDirection,
    isIncidenciasSheetOpen,
    isLoadingIncidencias,
    isLoadingRoute,
    miniMaps,
    isMapDark,
  } = state;
  
  const [date, setDate] = useState<DateRange | undefined>();

  useEffect(() => {
    if (routeGroups.length > 0) {
      const firstRecord = routeGroups[0].records[0];
      const lastGroup = routeGroups[routeGroups.length - 1];
      const lastRecord = lastGroup.records[lastGroup.records.length - 1];
      
      setDate({
        from: fromUnixTime(firstRecord.fecha),
        to: fromUnixTime(lastRecord.fecha),
      });
    }
  }, [routeGroups]);

  const handleFilterApply = useCallback(() => {
    setNestedDrawerOpen(false);
  }, []);

  const handleBackToFleet = () => {
    const action = () => {
      if (isIncidenciasSheetOpen) {
        dispatch({ type: 'CLOSE_INCIDENCIAS' });
      } else {
        dispatch({ type: 'BACK_TO_FLEET' });
      }
      setActivePanel('vehicles');
    };

    if (typeof document !== 'undefined' && (document as any).startViewTransition) {
        (document as any).startViewTransition(action);
    } else {
        action();
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        Error: {error.message}
      </div>
    );
  }

  const isDetailView = !!(historyVehicle || isIncidenciasSheetOpen || isLoadingRoute || isLoadingIncidencias);

  const togglePanel = (panel: PanelType) => {
    const action = () => {
      setActivePanel(prev => prev === panel ? null : panel);
    };

    if (typeof document !== 'undefined' && (document as any).startViewTransition) {
      (document as any).startViewTransition(action);
    } else {
      action();
    }
  };

  const renderMaps = () => {
    if (isDetailView) {
      return <FleetMap apiKey={apiKey} />;
    }

    if (isSplitView) {
      return (
        <ResizablePanelGroup direction={splitDirection} className="h-full w-full">
          <ResizablePanel defaultSize={50}>
            <FleetMap apiKey={apiKey} side="ida" />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-primary/20 hover:bg-primary transition-colors" />
          <ResizablePanel defaultSize={50}>
            <FleetMap apiKey={apiKey} side="vuelta" />
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }

    return <FleetMap apiKey={apiKey} />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background flex">
      <TooltipProvider delayDuration={0}>
        {/* Left Vertical Toolbar */}
        {!isDetailView && (
          <aside className="w-16 h-full bg-card border-r flex flex-col items-center py-4 gap-4 z-50 shadow-xl">
            <div className="mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Radar className="w-6 h-6 text-primary" />
              </div>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={activePanel === 'vehicles' ? 'default' : 'ghost'} 
                  size="icon" 
                  className={cn("h-12 w-12 rounded-xl transition-all", activePanel === 'vehicles' ? 'shadow-lg scale-105' : 'hover:scale-105')}
                  onClick={() => togglePanel('vehicles')}
                >
                  <Car className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Lista de Unidades</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={activePanel === 'minimaps' ? 'default' : 'ghost'} 
                  size="icon" 
                  className={cn("h-12 w-12 rounded-xl transition-all", activePanel === 'minimaps' ? 'shadow-lg scale-105' : 'hover:scale-105')}
                  onClick={() => togglePanel('minimaps')}
                >
                  <Radar className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Gestión de Mini-Maps</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={activePanel === 'settings' ? 'default' : 'ghost'} 
                  size="icon" 
                  className={cn("h-12 w-12 rounded-xl transition-all", activePanel === 'settings' ? 'shadow-lg scale-105' : 'hover:scale-105')}
                  onClick={() => togglePanel('settings')}
                >
                  <Settings2 className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Opciones de Mapa</TooltipContent>
            </Tooltip>

            <div className="mt-auto">
              <NotificationsDropdown apiKey={apiKey} />
            </div>
          </aside>
        )}

        {/* Floating Panel Layer (Desktop) */}
        {!isMobile && !isDetailView && activePanel && (
          <div 
            className="absolute top-4 left-20 bottom-4 w-[380px] z-40 transition-all duration-300 animate-in slide-in-from-left-4 fade-in"
          >
            <div className="h-full w-full bg-card/95 backdrop-blur-md rounded-xl border shadow-2xl overflow-hidden flex flex-col">
              {activePanel === 'vehicles' && <VehiclePanelContent onVehicleSelect={() => {}} />}
              {activePanel === 'minimaps' && <MiniMapManagementContent />}
              {activePanel === 'settings' && (
                <div className="p-4 flex flex-col gap-2">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Configuración de Vista</h3>
                   <Button variant="outline" className="justify-start h-12 gap-3" onClick={() => dispatch({ type: 'TOGGLE_SPLIT_VIEW' })}>
                      <Columns2 className="w-5 h-5 text-primary" />
                      {isSplitView ? 'Cerrar Vista Dividida' : 'Activar Vista Ida/Vuelta'}
                   </Button>
                   {isSplitView && (
                    <Button variant="outline" className="justify-start h-12 gap-3" onClick={() => dispatch({ type: 'TOGGLE_SPLIT_DIRECTION' })}>
                        {splitDirection === 'horizontal' ? <Rows2 className="w-5 h-5" /> : <Columns2 className="w-5 h-5" />}
                        Girar Orientación
                    </Button>
                   )}
                   <Button variant="outline" className="justify-start h-12 gap-3" onClick={() => dispatch({ type: 'SET_MAP_DARK_MODE', payload: !isMapDark })}>
                      {isMapDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-primary" />}
                      Cambiar a Tema {isMapDark ? 'Claro' : 'Oscuro'}
                   </Button>
                   {miniMaps.length > 0 && (
                     <Button variant="destructive" className="justify-start h-12 gap-3 mt-4" onClick={() => dispatch({ type: 'CLEAR_ALL_MINIMAPS' })}>
                        <Trash2 className="w-5 h-5" />
                        Limpiar Todos los Mini-Maps
                     </Button>
                   )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 relative">
          <div className="absolute inset-0 z-0">
            {renderMaps()}
          </div>

          {/* Floating Minimaps Overlay */}
          {!isDetailView && miniMaps.length > 0 && (
            <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-4 pointer-events-none max-h-[75vh] overflow-y-auto pr-2 no-scrollbar">
              {miniMaps.map((map) => (
                <div 
                  key={map.id} 
                  className="pointer-events-auto relative w-48 sm:w-64 aspect-square border-2 rounded-2xl overflow-hidden shadow-2xl bg-card ring-2 ring-primary/10 animate-in slide-in-from-right-8"
                >
                  <FleetMap apiKey={apiKey} trackedVehicleIds={map.vehicleIds} />
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      <div className="bg-primary px-1.5 py-0.5 rounded shadow-sm text-[8px] font-bold text-white uppercase flex items-center gap-1">
                        <Radar className="w-2 h-2" />
                        {map.name}
                      </div>
                      <div className="bg-card/90 backdrop-blur-sm px-1.5 py-0.5 rounded border shadow-sm text-[8px] font-bold text-foreground uppercase">
                        {map.vehicleIds.length} units
                      </div>
                  </div>
                  <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-6 w-6 z-20 shadow-lg hover:scale-110 transition-transform"
                      onClick={() => dispatch({ type: 'REMOVE_MINIMAP', payload: map.id })}
                    >
                      <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Mobile Overlay Toggle */}
          {isMobile && !isDetailView && !activePanel && (
             <div className="absolute bottom-6 left-6 z-40">
                <Button 
                  size="icon" 
                  className="h-14 w-14 rounded-full shadow-2xl"
                  onClick={() => setActivePanel('vehicles')}
                >
                  <Car className="h-6 w-6" />
                </Button>
             </div>
          )}

          {/* Bottom Drawer (Mobile) */}
          {isMobile && !isDetailView && activePanel && (
            <Drawer open={!!activePanel} onOpenChange={(open) => !open && setActivePanel(null)} modal={false}>
              <DrawerContent className="h-[75vh] flex flex-col focus:outline-none">
                <DrawerHandle />
                <div className="flex-1 overflow-hidden">
                   {activePanel === 'vehicles' && <VehiclePanelContent onVehicleSelect={() => setActivePanel(null)} />}
                   {activePanel === 'minimaps' && <MiniMapManagementContent />}
                   {activePanel === 'settings' && <div className="p-4">Settings...</div>}
                </div>
              </DrawerContent>
            </Drawer>
          )}

          {/* Detail View Header */}
          {isDetailView && (
            <div className="absolute top-0 left-0 p-4 w-full pointer-events-none z-40">
              <div className='relative w-full h-12 flex justify-between items-center max-w-[100vw]'>
                <div className='flex gap-3 items-center pointer-events-auto'>
                  {!state.isLoadingRoute && !state.isLoadingIncidencias && (
                    <Button onClick={handleBackToFleet} variant="secondary" className="shadow-lg bg-card/90 backdrop-blur-sm hover:bg-accent transition-colors font-bold border border-primary/20 h-10">
                      {isIncidenciasSheetOpen ? <X className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
                      {isIncidenciasSheetOpen ? 'Cerrar' : 'Volver'}
                    </Button>
                  )}
                </div>

                <div className='flex gap-2 items-center pointer-events-auto'>
                  {!isIncidenciasSheetOpen && !state.isLoadingRoute && (
                    <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-300">
                        <Button variant="secondary" size="icon" className="shadow-lg bg-card/90 backdrop-blur-sm border border-primary/20 h-10 w-10">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {isMobile ? (
                          <Drawer open={nestedDrawerOpen} onOpenChange={setNestedDrawerOpen} modal={false}>
                            <DrawerTrigger asChild>
                              <Button variant="secondary" size="icon" className="shadow-lg bg-card/90 backdrop-blur-sm border border-primary/20 h-10 w-10">
                                <CalendarIcon className="w-4 h-4" />
                              </Button>
                            </DrawerTrigger>
                            <DrawerContent>
                              <DrawerHandle />
                              <div className="p-4">
                                <DrawerHeader className="p-0 text-left mb-4">
                                  <DrawerTitle>Filtrar Historial</DrawerTitle>
                                </DrawerHeader>
                                <div className="flex justify-center">
                                  <Calendar mode="range" selected={date} onSelect={setDate} />
                                </div>
                                <Button onClick={handleFilterApply} className="w-full mt-4">Aplicar</Button>
                              </div>
                            </DrawerContent>
                          </Drawer>
                        ) : (
                          <div className="bg-card/90 backdrop-blur-sm rounded-lg shadow-lg border border-primary/20">
                            <DateRangePicker date={date} setDate={setDate} onApply={handleFilterApply} />
                          </div>
                        )}
                    </div>
                  )}
                  <NotificationsDropdown apiKey={apiKey} />
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlays */}
          {(state.isLoadingRoute || state.isLoadingIncidencias) && (
            <div
              style={{ viewTransitionName: 'loading-transition' }}
              className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-[100]"
            >
              <div className="flex items-center gap-3 text-foreground bg-card p-6 rounded-xl shadow-2xl border animate-in zoom-in-95 duration-200">
                <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                <p className="font-bold text-lg">{isLoadingIncidencias ? 'Cargando incidencias...' : 'Generando ruta...'}</p>
              </div>
            </div>
          )}
        </main>
      </TooltipProvider>

      <RouteHistorySheet date={date} setDate={setDate} onApply={handleFilterApply}/>
      <IncidenciasSheet />
    </div>
  );
}
