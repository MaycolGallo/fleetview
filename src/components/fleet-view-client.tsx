
'use client';

import React, { memo } from 'react';
import dynamic from 'next/dynamic';
import { RouteHistorySheet } from './route/route-history-sheet';
import { IncidenciasSheet } from './incidencias/incidencias-sheet';
import { Skeleton } from './ui/skeleton';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHandle, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FloatingToolbar } from './navigation/floating-toolbar';
import { DetailHeader } from './navigation/detail-header';
import { VehiclePanelContent } from './vehicle/vehicle-panel-content';
import { MiniMapManagementContent } from './minimap/minimap-management-content';
import { SettingsPanelContent } from './settings/settings-panel-content';
import { SharePanelContent } from './sharing/share-panel-content';
import { FleetAnalyticsContent } from './analytics/fleet-analytics-content';
import { PublicFleetView } from './sharing/public-fleet-view';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { APIProvider } from '@vis.gl/react-google-maps';

// Stable Dynamic Imports
const FleetMap = dynamic(() => import('./fleet-map'), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const FleetLeafletMap = dynamic(() => import('./leaflet/fleet-leaflet-map'), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const FleetMapboxMap = dynamic(() => import('./mapbox/fleet-mapbox-map'), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const MiniMapOverlayGrid = dynamic(() => import('./minimap/minimap-overlay-grid').then(mod => mod.MiniMapOverlayGrid), { ssr: false });

/**
 * Tactical Map Wrapper: Memoized to prevent unmounting and tile cache loss.
 * Uses Framer Motion for cross-fade transitions while keeping engines "hot".
 */
const TacticalMapLayer = memo(({ 
    provider, 
    apiKey, 
    side, 
    isMainMap = true,
    isVisible = true
}: { 
    provider: string, 
    apiKey: string, 
    side?: 'ida' | 'vuelta', 
    isMainMap?: boolean,
    isVisible?: boolean
}) => {
    let mapInstance;
    if (provider === 'leaflet') {
       mapInstance = <FleetLeafletMap side={side} isMainMap={isMainMap} />;
    } else if (provider === 'mapbox') {
       mapInstance = <FleetMapboxMap side={side} isMainMap={isMainMap} />;
    } else {
       mapInstance = <FleetMap apiKey={apiKey} side={side} isMainMap={isMainMap} />;
    }

    return (
      <motion.div 
        initial={false}
        animate={{ 
            opacity: isVisible ? 1 : 0,
            scale: isVisible ? 1 : 1.05,
            zIndex: isVisible ? 10 : 0
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className={cn(
            "absolute inset-0 w-full h-full overflow-hidden bg-background",
            !isVisible && "pointer-events-none"
        )}
      >
        {mapInstance}
        
        <AnimatePresence>
            {isVisible && side && (
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-[20] pointer-events-none"
              >
                 <div className={cn(
                    "px-6 py-2 rounded-xl border shadow-2xl backdrop-blur-md flex items-center gap-3 transition-all",
                    side === 'ida' 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                      : "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      side === 'ida' ? "bg-emerald-500" : "bg-sky-500"
                    )} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] font-sans" style={{ fontFeatureSettings: '"cv11", "ss01"' }}>
                      Trayecto: {side}
                    </span>
                 </div>
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    );
});
TacticalMapLayer.displayName = 'TacticalMapLayer';

export default function FleetViewClient({ apiKey }: { apiKey: string }) {
  const { state, error } = useFleetState();
  const dispatch = useFleetDispatch();
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();

  const { 
    isSplitView, 
    splitDirection, 
    historyVehicle, 
    isIncidenciasSheetOpen, 
    isLoadingRoute, 
    isLoadingIncidencias, 
    focusedMiniMapId,
    routeGroups,
    incidencias,
    mapProvider,
    activePanel
  } = state;

  const shareToken = searchParams.get('s');
  const isPublicView = !!shareToken;
  const isDetailView = !!(historyVehicle || isIncidenciasSheetOpen || focusedMiniMapId);
  const isInitialLoading = (isLoadingRoute && routeGroups.length === 0) || (isLoadingIncidencias && incidencias.length === 0);

  if (error) return <div className="flex items-center justify-center h-full text-destructive">Error: {error.message}</div>;
  if (isPublicView) return <PublicFleetView apiKey={apiKey} token={shareToken} />;

  const closeMobilePanel = () => {
    dispatch({ type: 'SET_ACTIVE_PANEL', payload: null });
  };

  // Determine which layer is active to drive animations
  const showSplitWorkspace = isSplitView && !isDetailView && !isMobile;

  return (
    <APIProvider apiKey={apiKey}>
        <div className="relative h-screen w-screen overflow-hidden bg-background">
        <main className="absolute inset-0 z-0">
            <div className="h-full w-full relative">
                {/* Layer 1: Standard Workspace (History/Incidents/Fleet) */}
                <TacticalMapLayer 
                    provider={mapProvider} 
                    apiKey={apiKey} 
                    isMainMap={true} 
                    isVisible={!showSplitWorkspace} 
                />

                {/* Layer 2: Tactical Split Workspace (IDA/VUELTA) */}
                {!isMobile && (
                    <motion.div 
                        initial={false}
                        animate={{ 
                            opacity: showSplitWorkspace ? 1 : 0,
                            scale: showSplitWorkspace ? 1 : 0.98,
                            zIndex: showSplitWorkspace ? 15 : 0
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className={cn(
                            "absolute inset-0 w-full h-full",
                            !showSplitWorkspace && "pointer-events-none"
                        )}
                    >
                        <ResizablePanelGroup direction={splitDirection} className="h-full w-full">
                            <ResizablePanel defaultSize={50} className="relative">
                                <TacticalMapLayer provider={mapProvider} apiKey={apiKey} side="ida" isMainMap={true} isVisible={showSplitWorkspace} />
                            </ResizablePanel>
                            <ResizableHandle withHandle className="bg-primary/20 hover:bg-primary transition-colors z-50" />
                            <ResizablePanel defaultSize={50} className="relative">
                                <TacticalMapLayer provider={mapProvider} apiKey={apiKey} side="vuelta" isMainMap={true} isVisible={showSplitWorkspace} />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </motion.div>
                )}
            </div>
        </main>

        {!isDetailView && (
            <>
            <FloatingToolbar />
            
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
            <Drawer 
                open={!!activePanel} 
                onOpenChange={(open) => !open && closeMobilePanel()} 
                modal={false}
            >
            <DrawerContent className="h-[85vh]">
                <DrawerHandle />
                <div className="sr-only">
                    <DrawerHeader>
                        <DrawerTitle>Panel de Control Mobile</DrawerTitle>
                        <DrawerDescription>Gestión táctica de unidades y radares.</DrawerDescription>
                    </DrawerHeader>
                </div>
                <div className="flex-1 overflow-hidden">
                    {activePanel === 'vehicles' && <VehiclePanelContent onVehicleSelect={() => closeMobilePanel()} />}
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
                    Sincronizando Telemetría...
                </p>
            </div>
        )}
        </div>
    </APIProvider>
  );
}
