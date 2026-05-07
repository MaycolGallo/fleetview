
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { RouteHistorySheet } from './route/route-history-sheet';
import { IncidenciasSheet } from './incidencias/incidencias-sheet';
import { Skeleton } from './ui/skeleton';
import { useFleetState } from '@/context/fleet-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHandle } from '@/components/ui/drawer';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FloatingToolbar } from './navigation/floating-toolbar';
import { DetailHeader } from './navigation/detail-header';
import { MiniMapOverlayGrid } from './minimap/minimap-overlay-grid';
import { VehiclePanelContent } from './vehicle/vehicle-panel-content';
import { MiniMapManagementContent } from './minimap/minimap-management-content';
import { SettingsPanelContent } from './settings/settings-panel-content';

const FleetMap = dynamic(() => import('./fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export type PanelType = 'vehicles' | 'minimaps' | 'settings' | null;

export function FleetViewClient({ apiKey }: { apiKey: string }) {
  const { state, error } = useFleetState();
  const isMobile = useIsMobile();
  const [activePanel, setActivePanel] = useState<PanelType>('vehicles');

  const { isSplitView, splitDirection, historyVehicle, isIncidenciasSheetOpen, isLoadingRoute, isLoadingIncidencias } = state;
  const isDetailView = !!(historyVehicle || isIncidenciasSheetOpen || isLoadingRoute || isLoadingIncidencias);

  if (error) return <div className="flex items-center justify-center h-full text-destructive">Error: {error.message}</div>;

  const renderMaps = () => {
    if (!isDetailView && isSplitView) {
      return (
        <ResizablePanelGroup direction={splitDirection} className="h-full w-full">
          <ResizablePanel defaultSize={50}><FleetMap apiKey={apiKey} side="ida" /></ResizablePanel>
          <ResizableHandle withHandle className="bg-primary/20 hover:bg-primary transition-colors" />
          <ResizablePanel defaultSize={50}><FleetMap apiKey={apiKey} side="vuelta" /></ResizablePanel>
        </ResizablePanelGroup>
      );
    }
    return <FleetMap apiKey={apiKey} />;
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <main className="absolute inset-0 z-0">{renderMaps()}</main>

      {!isDetailView && (
        <>
          <FloatingToolbar activePanel={activePanel} setActivePanel={setActivePanel} />
          {!isMobile && activePanel && (
            <div className="absolute top-6 left-24 bottom-6 w-[380px] z-40 animate-in slide-in-from-left-4 fade-in">
              <div className="h-full w-full bg-card/95 backdrop-blur-md rounded-2xl border shadow-2xl overflow-hidden">
                {activePanel === 'vehicles' && <VehiclePanelContent onVehicleSelect={() => {}} />}
                {activePanel === 'minimaps' && <MiniMapManagementContent />}
                {activePanel === 'settings' && <SettingsPanelContent />}
              </div>
            </div>
          )}
          <MiniMapOverlayGrid apiKey={apiKey} />
        </>
      )}

      {isDetailView && <DetailHeader apiKey={apiKey} />}

      {isMobile && !isDetailView && activePanel && (
        <Drawer open={!!activePanel} onOpenChange={(open) => !open && setActivePanel(null)} modal={false}>
          <DrawerContent className="h-[75vh]">
            <DrawerHandle />
            <div className="flex-1 overflow-hidden">
              {activePanel === 'vehicles' && <VehiclePanelContent onVehicleSelect={() => setActivePanel(null)} />}
              {activePanel === 'minimaps' && <MiniMapManagementContent />}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <RouteHistorySheet date={undefined} setDate={() => {}} onApply={() => {}} />
      <IncidenciasSheet />
    </div>
  );
}
