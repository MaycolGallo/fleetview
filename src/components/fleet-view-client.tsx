'use client';

import React, { useTransition, memo } from 'react';
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

// Robust dynamic imports using default exports for stability
const FleetMap = dynamic(() => import('./fleet-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const FleetLeafletMap = dynamic(() => import('./leaflet/fleet-leaflet-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const FleetMapboxMap = dynamic(() => import('./mapbox/fleet-mapbox-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const MiniMapOverlayGrid = dynamic(() => import('./minimap/minimap-overlay-grid').then(mod => mod.MiniMapOverlayGrid), {
  ssr: false,
});

/**
 * Tactical Map Wrapper to ensure instances stay "hot" in the DOM.
 * Memoized to prevent unmounting during heavy parent re-renders.
 */
const TacticalMapLayer = memo(({ 
    provider, 
    apiKey, 
    side, 
    isMainMap = true 
}: { 
    provider: string, 
    apiKey: string, 
    side?: 'ida' | 'vuelta', 
    isMainMap?: boolean 
}) => {
    let map;
    if (provider === 'leaflet') {
       map = <FleetLeafletMap side={side} isMainMap={isMainMap} />;
    } else if (provider === 'mapbox') {
       map = <FleetMapboxMap side={side} isMainMap={isMainMap} />;
    } else {
       map = <FleetMap apiKey={apiKey} side={side} isMainMap={isMainMap} />;
    }

    return (
      <div className="relative w-full h-full overflow-hidden">
        {map}
        {side && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[20] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-700">
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
          </div>
        )}
      </div>
    );
});
TacticalMapLayer.displayName = 'TacticalMapLayer';

export default function FleetViewClient({ apiKey }: { apiKey: string }) {
  const { state, error } = useFleetState();
  const dispatch = useFleetDispatch();
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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

  if (isPublicView) {
    return <PublicFleetView apiKey={apiKey} token={shareToken} />;
  }

  const closeMobilePanel = () => {
    startTransition(() => {
        dispatch({ type: 'SET_ACTIVE_PANEL', payload: null });
    });
  };

  return (
    <APIProvider apiKey={apiKey}>
        <div className="relative h-screen w-screen overflow-hidden bg-background">
        <main className="absolute inset-0 z-0">
            <AnimatePresence mode="wait">
            <motion.div
                key={mapProvider}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="h-full w-full relative"
            >
                {/* Layer 1: Standard / Detail Workspace (History, Incidents, Single Map) */}
                <div 
                    className={cn(
                        "absolute inset-0 transition-all duration-500",
                        (isSplitView && !isDetailView) ? "opacity-0 pointer-events-none z-0" : "opacity-100 z-10"
                    )}
                >
                    <TacticalMapLayer provider={mapProvider} apiKey={apiKey} isMainMap={true} />
                </div>

                {/* Layer 2: Tactical Split Workspace (Ida/Vuelta) */}
                {!isMobile && (
                    <div 
                        className={cn(
                            "absolute inset-0 transition-all duration-500",
                            (!isSplitView || isDetailView) ? "opacity-0 pointer-events-none z-0" : "opacity-100 z-10"
                        )}
                    >
                        <ResizablePanelGroup direction={splitDirection} className="h-full w-full">
                            <ResizablePanel defaultSize={50}>
                                <TacticalMapLayer provider={mapProvider} apiKey={apiKey} side="ida" isMainMap={true} />
                            </ResizablePanel>
                            <ResizableHandle withHandle className="bg-primary/20 hover:bg-primary transition-colors" />
                            <ResizablePanel defaultSize={50}>
                                <TacticalMapLayer provider={mapProvider} apiKey={apiKey} side="vuelta" isMainMap={true} />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                )}
            </motion.div>
            </AnimatePresence>
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
                        <DrawerDescription>
                            {activePanel === 'vehicles' ? 'Lista de Unidades' : 
                            activePanel === 'minimaps' ? 'Gestión de Radares' : 
                            activePanel === 'stats' ? 'Inteligencia de Flota' : 'Configuración de Compartir'}
                        </DrawerDescription>
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
                Cargando Telemetría...
            </p>
            </div>
        )}
        </div>
    </APIProvider>
  );
}