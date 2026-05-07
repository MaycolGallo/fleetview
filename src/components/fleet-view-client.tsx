
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { RouteHistorySheet } from './route/route-history-sheet';
import { IncidenciasSheet } from './incidencias/incidencias-sheet';
import { Button } from './ui/button';
import { 
  ArrowLeft, 
  PanelLeft, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  List, 
  Columns2, 
  X, 
  Rows2, 
  Settings2,
  Trash2,
  Moon,
  Sun,
  LayoutGrid,
  Radar
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
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fromUnixTime } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { DateRangePicker } from '@/components/route/date-range-picker';
import { VehiclePanelContent } from '@/components/vehicle/vehicle-panel-content';
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

export function FleetViewClient({ apiKey }: FleetViewClientProps) {
  const { state, error } = useFleetState();
  const dispatch = useFleetDispatch();
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const isMobile = useIsMobile();
  const [nestedDrawerOpen, setNestedDrawerOpen] = useState(false);

  const {
    historyVehicle,
    routeGroups,
    isSplitView,
    splitDirection,
    isIncidenciasSheetOpen,
    isLoadingIncidencias,
    isLoadingRoute,
    trackedVehicleIds,
    isMapDark,
    vehicles
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
      setIsPanelOpen(true);
    };

    if (typeof document !== 'undefined' && (document as any).startViewTransition) {
        (document as any).startViewTransition(action);
    } else {
        action();
    }
  };

  const handleOpenPanel = () => {
    if (typeof document !== 'undefined' && (document as any).startViewTransition) {
      (document as any).startViewTransition(() => {
        setIsPanelOpen(true);
      });
    } else {
      setIsPanelOpen(true);
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        An error occurred: {error.message}.
      </div>
    );
  }

  const panelContent = <VehiclePanelContent onVehicleSelect={() => {}} onClose={() => setIsPanelOpen(false)} />;

  const isDetailView = !!(historyVehicle || isIncidenciasSheetOpen || isLoadingRoute || isLoadingIncidencias);

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
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Main Map Layer */}
      <div className="absolute inset-0 z-0">
        {renderMaps()}
      </div>

      {/* Floating Panel Layer (Desktop) */}
      {!isMobile && !isDetailView && isPanelOpen && (
        <div 
          className="absolute top-4 left-4 bottom-4 w-[380px] z-20 transition-all duration-300 animate-in slide-in-from-left-4 fade-in-20"
        >
          <div className="h-full w-full bg-card/95 backdrop-blur-md rounded-xl border shadow-2xl overflow-hidden flex flex-col">
            {panelContent}
          </div>
        </div>
      )}

      {/* Floating Minimaps Overlay (The focused squares) */}
      {!isDetailView && trackedVehicleIds.length > 0 && (
        <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-4 pointer-events-none max-h-[75vh] overflow-y-auto pr-2 no-scrollbar">
          {trackedVehicleIds.map((id) => (
            <div 
              key={id} 
              className="pointer-events-auto relative w-48 sm:w-64 aspect-square border-2 rounded-2xl overflow-hidden shadow-2xl bg-card ring-2 ring-primary/10 animate-in slide-in-from-right-8"
            >
              <FleetMap apiKey={apiKey} trackedVehicleId={id} />
               <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  <div className="bg-primary px-1.5 py-0.5 rounded shadow-sm text-[8px] font-bold text-white uppercase flex items-center gap-1">
                    <Radar className="w-2 h-2" />
                    Radar Lock
                  </div>
                  <div className="bg-card/90 backdrop-blur-sm px-1.5 py-0.5 rounded border shadow-sm text-[8px] font-bold text-foreground uppercase">
                    {vehicles.find(v => v.id_vehiculo === id)?.placa}
                  </div>
               </div>
               <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-6 w-6 z-20 shadow-lg hover:scale-110 transition-transform"
                  onClick={() => dispatch({ type: 'TOGGLE_TRACK_VEHICLE', payload: id })}
                >
                  <X className="h-3 w-3" />
               </Button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Drawer (Mobile) */}
      {isMobile && !isDetailView && (
        <Drawer open={isPanelOpen} onOpenChange={setIsPanelOpen} modal={false}>
          <DrawerContent className="h-[75vh] flex flex-col focus:outline-none">
            <DrawerHandle />
            <div className="flex-1 overflow-hidden">
               {panelContent}
            </div>
          </DrawerContent>
        </Drawer>
      )}
      
      {/* Top Header Controls Overlay */}
      <div className="absolute top-0 left-0 p-4 w-full pointer-events-none z-40">
        <div className='relative w-full h-12 flex justify-between items-center max-w-[100vw]'>
          <div className='flex gap-3 items-center pointer-events-auto'>
             {!isDetailView && !isPanelOpen && (
              <Button 
                variant="secondary" 
                size="icon" 
                onClick={handleOpenPanel} 
                className='shadow-lg bg-card/90 backdrop-blur-sm hover:scale-110 transition-transform border border-primary/20'
              >
                {isMobile ? <List className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
              </Button>
            )}

            {isDetailView && !state.isLoadingRoute && !state.isLoadingIncidencias && (
              <Button onClick={handleBackToFleet} variant="secondary" className="shadow-lg bg-card/90 backdrop-blur-sm hover:bg-accent transition-colors font-bold border border-primary/20 h-10">
                {isIncidenciasSheetOpen ? <X className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
                {isIncidenciasSheetOpen ? 'Cerrar' : 'Volver'}
              </Button>
            )}
          </div>

          {!isDetailView && (
            <div className="pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-500">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="shadow-lg bg-card/90 backdrop-blur-sm border border-primary/20 font-bold gap-2 h-10 px-4">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <span className="hidden sm:inline">Opciones de Mapa</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-card/95 backdrop-blur-md" align="center">
                  <DropdownMenuLabel>Vista de Flota</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => dispatch({ type: 'TOGGLE_SPLIT_VIEW' })} className="cursor-pointer">
                    <Columns2 className="mr-2 h-4 w-4" />
                    <span>{isSplitView ? 'Cerrar Vista Dividida' : 'Vista Ida/Vuelta'}</span>
                  </DropdownMenuItem>
                  {isSplitView && (
                    <DropdownMenuItem onClick={() => dispatch({ type: 'TOGGLE_SPLIT_DIRECTION' })} className="cursor-pointer">
                      {splitDirection === 'horizontal' ? <Rows2 className="mr-2 h-4 w-4" /> : <Columns2 className="mr-2 h-4 w-4" />}
                      <span>Girar Orientación</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => dispatch({ type: 'SET_MAP_DARK_MODE', payload: !isMapDark })} className="cursor-pointer">
                    {isMapDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                    <span>Tema {isMapDark ? 'Claro' : 'Oscuro'}</span>
                  </DropdownMenuItem>
                  {trackedVehicleIds.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => dispatch({ type: 'SET_ALL_VEHICLES_VISIBILITY', payload: { ids: trackedVehicleIds, visible: false } })}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Cerrar Todos los Mini-maps</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <div className='flex gap-2 items-center pointer-events-auto'>
            {isDetailView && !isIncidenciasSheetOpen && !state.isLoadingRoute && (
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

      <RouteHistorySheet date={date} setDate={setDate} onApply={handleFilterApply}/>
      <IncidenciasSheet />
    </div>
  );
}
