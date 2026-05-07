'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { RouteHistorySheet } from './route/route-history-sheet';
import { IncidenciasSheet } from './incidencias/incidencias-sheet';
import { Button } from './ui/button';
import { ArrowLeft, PanelLeft, RefreshCw, Calendar as CalendarIcon, List, Columns2, X, Rows2, Radar } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { cn } from '@/lib/utils';
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
import { format, fromUnixTime } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/route/date-range-picker';
import { VehiclePanelContent } from '@/components/vehicle/vehicle-panel-content';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';


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

  const handleTimeChange = (type: 'from' | 'to', value: string) => {
    if (!value) return;
    const [hours, minutes] = value.split(':').map(Number);
    if (!date || (type === 'from' && !date.from) || (type === 'to' && !date.to)) return;

    if (type === 'from' && date.from) {
      const newFrom = new Date(date.from);
      newFrom.setHours(hours, minutes, 0, 0);
      setDate({ ...date, from: newFrom });
    }
    
    if (type === 'to' && date.to) {
      const newTo = new Date(date.to);
      newTo.setHours(hours, minutes, 0, 0);
      setDate({ ...date, to: newTo });
    }
  }

  useEffect(() => {
    if (historyVehicle && isPanelOpen) {
      // @ts-ignore
      if (document.startViewTransition) {
        // @ts-ignore
        document.startViewTransition(() => {
          setIsPanelOpen(false);
        });
      } else {
        setIsPanelOpen(false);
      }
    }
  }, [historyVehicle, isPanelOpen]);

  const handleBackToFleet = () => {
    const action = () => {
      if (isIncidenciasSheetOpen) {
        dispatch({ type: 'CLOSE_INCIDENCIAS' });
      } else {
        dispatch({ type: 'BACK_TO_FLEET' });
      }
      setIsPanelOpen(true);
    };

    // @ts-ignore
    if (document.startViewTransition) {
        // @ts-ignore
        document.startViewTransition(action);
    } else {
        action();
    }
  };

  const handleToggleSplitView = () => {
    // @ts-ignore
    if (document.startViewTransition) {
      // @ts-ignore
      document.startViewTransition(() => {
        dispatch({ type: 'TOGGLE_SPLIT_VIEW' });
      });
    } else {
      dispatch({ type: 'TOGGLE_SPLIT_VIEW' });
    }
  };

  const handleToggleSplitDirection = () => {
    // @ts-ignore
    if (document.startViewTransition) {
      // @ts-ignore
      document.startViewTransition(() => {
        dispatch({ type: 'TOGGLE_SPLIT_DIRECTION' });
      });
    } else {
      dispatch({ type: 'TOGGLE_SPLIT_DIRECTION' });
    }
  };

  const handleOpenPanel = () => {
    // @ts-ignore
    if (document.startViewTransition) {
      // @ts-ignore
      document.startViewTransition(() => {
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

  const isDetailView = historyVehicle || isIncidenciasSheetOpen || isLoadingRoute || isLoadingIncidencias;

  const renderMaps = () => {
    if (isDetailView) {
      return <FleetMap apiKey={apiKey} />;
    }

    if (trackedVehicleIds.length > 0) {
      return (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={60} className="relative">
             {!isSplitView ? (
              <FleetMap apiKey={apiKey} />
            ) : (
              <ResizablePanelGroup direction={splitDirection} className="h-full w-full">
                <ResizablePanel defaultSize={50}>
                  <FleetMap apiKey={apiKey} side="ida" />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>
                  <FleetMap apiKey={apiKey} side="vuelta" />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-primary/20 hover:bg-primary transition-colors" />
          <ResizablePanel defaultSize={40}>
            <ResizablePanelGroup direction="vertical">
              {trackedVehicleIds.map((id, index) => (
                <React.Fragment key={id}>
                  <ResizablePanel defaultSize={100 / trackedVehicleIds.length}>
                    <FleetMap apiKey={apiKey} trackedVehicleId={id} />
                  </ResizablePanel>
                  {index < trackedVehicleIds.length - 1 && <ResizableHandle withHandle />}
                </React.Fragment>
              ))}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
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
      {/* Map Layers */}
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
        <div className='relative w-full h-12 flex justify-between'>
          <div className='flex gap-2 items-start pointer-events-auto'>
            {!isDetailView && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
                <Button 
                  variant={isSplitView ? "default" : "secondary"}
                  onClick={handleToggleSplitView}
                  className={cn("shadow-lg backdrop-blur-sm px-4 transition-all duration-300", !isSplitView && "bg-card/90")}
                  title="Toggle Split View (Ida / Vuelta)"
                >
                  <Columns2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{isSplitView ? 'Close Split' : 'Split View'}</span>
                </Button>

                {isSplitView && (
                  <Button 
                    variant="secondary"
                    onClick={handleToggleSplitDirection}
                    className="shadow-lg backdrop-blur-sm px-4 bg-card/90 animate-in fade-in zoom-in duration-300"
                    title="Toggle Layout Orientation"
                  >
                    {splitDirection === 'horizontal' ? <Rows2 className="mr-2 h-4 w-4" /> : <Columns2 className="mr-2 h-4 w-4" />}
                    <span className="hidden sm:inline">{splitDirection === 'horizontal' ? 'Vertical' : 'Horizontal'}</span>
                  </Button>
                )}
                
                {trackedVehicleIds.length > 0 && (
                   <Button 
                    variant="destructive"
                    onClick={() => dispatch({ type: 'SET_ALL_VEHICLES_VISIBILITY', payload: { ids: [], visible: false } })} // Just use as a clear all tracking for now
                    className="shadow-lg backdrop-blur-sm px-4 animate-in fade-in zoom-in"
                    title="Stop all tracking"
                  >
                    <X className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Stop Tracking</span>
                  </Button>
                )}
              </div>
            )}

            {!isDetailView && !isPanelOpen ? (
              <div style={{ viewTransitionName: 'filters-transition' }}>
                <Button 
                  variant="secondary"
                  size="icon"
                  onClick={handleOpenPanel} 
                  className='shadow-lg bg-card/90 backdrop-blur-sm hover:scale-110 transition-transform'
                >
                  {isMobile ? <List className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
                </Button>
              </div>
            ) : null}

            {isDetailView && !state.isLoadingRoute && !state.isLoadingIncidencias ? (
              <div style={{ viewTransitionName: 'back-button-transition' }} className="flex items-center gap-2">
                <Button onClick={handleBackToFleet} variant="secondary" className="shadow-lg bg-card/90 backdrop-blur-sm hover:bg-accent transition-colors">
                  {isIncidenciasSheetOpen ? <X className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
                  {isIncidenciasSheetOpen ? 'Cerrar Incidencias' : 'Back to Fleet'}
                </Button>
                
                {!isIncidenciasSheetOpen && (
                  <>
                    <Button variant="secondary" size="icon" className="shadow-lg bg-card/90 backdrop-blur-sm hover:rotate-180 transition-transform duration-500">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {isMobile ? (
                      <Drawer open={nestedDrawerOpen} onOpenChange={setNestedDrawerOpen} modal={false}>
                        <DrawerTrigger asChild>
                          <Button variant="secondary" size="icon" className="shadow-lg bg-card/90 backdrop-blur-sm">
                            <CalendarIcon className="w-4 h-4" />
                            <span className="sr-only">Filter by date</span>
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <DrawerHandle />
                          <div className="p-4 overflow-y-auto">
                            <DrawerHeader className="p-0 text-left mb-4">
                              <DrawerTitle>Filter Route History</DrawerTitle>
                              <DrawerDescription>Select a date and time range.</DrawerDescription>
                            </DrawerHeader>
                            <div className="flex justify-center">
                              <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={1}
                              />
                            </div>
                            <div className='pt-4 space-y-4'>
                              <div className="grid grid-cols-2 gap-4">
                                <div className='space-y-2'>
                                  <Label className='text-sm font-medium'>Start time</Label>
                                  <Input 
                                    type="time" 
                                    defaultValue={date?.from ? format(date.from, 'HH:mm') : '00:00'}
                                    onChange={(e) => handleTimeChange('from', e.target.value)}
                                    disabled={!date?.from}
                                  />
                                </div>
                                <div className='space-y-2'>
                                  <Label className='text-sm font-medium'>End time</Label>
                                  <Input 
                                    type="time" 
                                    defaultValue={date?.to ? format(date.to, 'HH:mm') : '23:59'}
                                    onChange={(e) => handleTimeChange('to', e.target.value)}
                                    disabled={!date?.to}
                                  />
                                </div>
                              </div>
                              <Button onClick={handleFilterApply} className="w-full">Apply</Button>
                            </div>
                          </div>
                        </DrawerContent>
                      </Drawer>
                    ) : (
                      <div className="bg-card/90 backdrop-blur-sm rounded-md shadow-lg pointer-events-auto animate-in fade-in slide-in-from-left-2 duration-300">
                        <DateRangePicker date={date} setDate={setDate} onApply={handleFilterApply} />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </div>

          <div className='flex gap-2 items-start pointer-events-auto'>
            <NotificationsDropdown apiKey={apiKey} />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {(state.isLoadingRoute || state.isLoadingIncidencias) && (
        <div
          style={{ viewTransitionName: 'loading-transition' }}
          className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-[100]"
        >
          <div className="flex items-center gap-2 text-foreground bg-card p-4 rounded-lg shadow-xl border animate-in zoom-in-95 duration-200">
            <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            <p className="font-medium">{isLoadingIncidencias ? 'Cargando incidencias...' : 'Generando ruta...'}</p>
          </div>
        </div>
      )}

      {/* Sheets Layer */}
      <RouteHistorySheet date={date} setDate={setDate} onApply={handleFilterApply}/>
      <IncidenciasSheet />
    </div>
  );
}
