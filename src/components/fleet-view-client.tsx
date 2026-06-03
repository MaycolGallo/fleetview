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
import { SharePanelContent } from './sharing/share-panel-content';
import { FleetAnalyticsContent } from './analytics/fleet-analytics-content';
import { PublicFleetView } from './sharing/public-fleet-view';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const FleetMap = dynamic(() => import('./fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export type PanelType = 'vehicles' | 'minimaps' | 'settings' | 'share' | 'stats' | null;

export function FleetViewClient({ apiKey }: { apiKey: string }) {
  const { state, error } = useFleetState();
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const [activePanel, setActivePanel] = useState<PanelType>('vehicles');

  const { 
    isSplitView, 
    splitDirection, 
    historyVehicle, 
    isIncidenciasSheetOpen, 
    isLoadingRoute, 
    isLoadingIncidencias, 
    focusedMiniMapId,
    routeGroups,
    incidencias
  } = state;

  // Check for shared mode
  const shareToken = searchParams.get('s');
  const isPublicView = !!shareToken;

  const isDetailView = !!(historyVehicle || isIncidenciasSheetOpen || focusedMiniMapId);

  // Determine if we should show the INITIAL big loader
  const isInitialLoading = (isLoadingRoute && routeGroups.length === 0) || (isLoadingIncidencias && incidencias.length === 0);

  if (error) return <div className="flex items-center justify-center h-full text-destructive">Error: {error.message}</div>;

  if (isPublicView) {
    return <PublicFleetView apiKey={apiKey} token={shareToken} />;
  }

  const renderMaps = () => {
    if (!isDetailView && isSplitView) {
      return (
        <ResizablePanelGroup direction={splitDirection} className="h-full w-full">
          <ResizablePanel defaultSize={50}><FleetMap apiKey={apiKey} side="ida" isMainMap={true} /></ResizablePanel>
          <ResizableHandle withHandle className="bg-primary/20 hover:bg-primary transition-colors" />
          <ResizablePanel defaultSize={50}><FleetMap apiKey={apiKey} side="vuelta" isMainMap={true} /></ResizablePanel>
        </ResizablePanelGroup>
      );
    }
    return <FleetMap apiKey={apiKey} isMainMap={true} />;
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <main className="absolute inset-0 z-0">{renderMaps()}</main>

      {!isDetailView && (
        <>
          <FloatingToolbar activePanel={activePanel} setActivePanel={setActivePanel} />
          
          <AnimatePresence mode="wait">
            {!isMobile && activePanel && (
              <motion.div 
                key={activePanel}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-6 left-24 bottom-6 w-[420px] z-40"
              >
                <div className="h-full w-full bg-card/95 backdrop-blur-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col">
                  {activePanel === 'vehicles' && <VehiclePanelContent onVehicleSelect={() => {}} />}
                  {activePanel === 'minimaps' && <MiniMapManagementContent />}
                  {activePanel === 'settings' && <SettingsPanelContent />}
                  {activePanel === 'share' && <SharePanelContent />}
                  {activePanel === 'stats' && <FleetAnalyticsContent />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <MiniMapOverlayGrid apiKey={apiKey} />
        </>
      )}

      {isDetailView && <DetailHeader apiKey={apiKey} />}

      {isMobile && !isDetailView && activePanel && (
        <Drawer open={!!activePanel} onOpenChange={(open) => !open && setActivePanel(null)} modal={false}>
          <DrawerContent className="h-[85vh]">
            <DrawerHandle />
            <div className="flex-1 overflow-hidden">
              {activePanel === 'vehicles' && <VehiclePanelContent onVehicleSelect={() => setActivePanel(null)} />}
              {activePanel === 'minimaps' && <MiniMapManagementContent />}
              {activePanel === 'stats' && <FleetAnalyticsContent />}
              {activePanel === 'share' && <SharePanelContent />}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <RouteHistorySheet date={undefined} setDate={() => {}} onApply={() => {}} />
      <IncidenciasSheet />

      {isInitialLoading && (
        <div className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="p-8 rounded-full bg-primary/10 border-2 border-primary/20 animate-pulse mb-6">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
           </div>
           <p className="text-sm font-bold uppercase tracking-widest text-primary animate-bounce">
              Cargando Telemetría...
           </p>
        </div>
      )}
    </div>
  );
}