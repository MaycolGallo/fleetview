
'use client';

/**
 * @fileOverview MiniMap Overlay Grid.
 * Orchestrates the secondary tactical displays and swaps focus between detail and overview.
 */

import React, { useTransition } from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { getMapFlags } from '@/context/fleet-selectors';
import { Button } from '@/components/ui/button';
import { Radar, X, ArrowLeftRight, RefreshCw, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

const FleetMap = dynamic(() => import('../fleet-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const FleetLeafletMap = dynamic(() => import('../leaflet/fleet-leaflet-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const FleetMapboxMap = dynamic(() => import('../mapbox/fleet-mapbox-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export function MiniMapOverlayGrid({ apiKey }: { apiKey: string }) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { 
    miniMaps, 
    visibleMiniMapIds, 
    focusedMiniMapId, 
    mapProvider,
  } = state;
  
  const mapFlags = getMapFlags(state);
  const [isPending, startTransition] = useTransition();

  // Tactical Role Reversal:
  // When focused, secondary radars hide and the General Overview enters as a mini.
  // Hide when route history is open
  const showOverviewAsMini = mapFlags.isFocusedView;
  
  const activeMiniMaps = focusedMiniMapId 
    ? [] 
    : miniMaps.filter(m => visibleMiniMapIds.includes(m.id));

  const renderMapInstance = (props: any) => {
    switch (mapProvider) {
        case 'leaflet': return <FleetLeafletMap {...props} />;
        case 'mapbox': return <FleetMapboxMap {...props} />;
        default: return <FleetMap apiKey={apiKey} {...props} />;
    }
  };

  const handleUnfocus = () => {
    startTransition(() => {
        dispatch({ type: 'UNFOCUS_MINIMAP' });
    });
  };

  const handleFocus = (id: string) => {
    startTransition(() => {
        dispatch({ type: 'FOCUS_MINIMAP', payload: id });
    });
  };

  const handleToggle = (id: string) => {
    startTransition(() => {
        dispatch({ type: 'TOGGLE_MINIMAP_VISIBILITY', payload: id });
    });
  };

  return (
    <div className="absolute bottom-6 right-6 z-30 flex flex-col-reverse flex-wrap-reverse items-end justify-start gap-4 pointer-events-none h-[80vh] overflow-visible">
      <AnimatePresence mode="popLayout" initial={false}>
        {showOverviewAsMini && (
          <motion.div 
            key={`overview-mini-${mapProvider}`}
            layout
            initial={{ x: 100, scale: 0.8, opacity: 0 }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            exit={{ x: 100, scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="pointer-events-auto relative flex-grow shrink-0 min-h-[calc(20vh-16px)] max-h-[calc(40vh-16px)] w-96 border-2 rounded-2xl overflow-hidden shadow-2xl bg-card ring-2 ring-primary/20"
          >
            {renderMapInstance({ isMainMap: true })}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              <div className="bg-muted px-1.5 py-0.5 rounded shadow-sm text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                Vista General
              </div>
            </div>
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute top-2 right-2 h-7 w-7 z-20 shadow-lg hover:scale-110 transition-transform bg-card/90 border-2 border-primary/20"
                    onClick={handleUnfocus}
                    disabled={isPending}
                    >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-4 w-4 text-primary" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Restaurar General</TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}

        {activeMiniMaps.map((map) => (
          <motion.div 
            key={`${map.id}-${mapProvider}`} 
            layout
            initial={{ x: 100, scale: 0.8, opacity: 0 }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            exit={{ x: 100, scale: 0.8, opacity: 0 }}
            transition={{ 
                type: "spring", 
                stiffness: 350, 
                damping: 30,
            }}
            className="pointer-events-auto relative flex-grow shrink-0 min-h-[calc(20vh-16px)] max-h-[calc(40vh-16px)] w-96 border-2 rounded-2xl overflow-hidden shadow-2xl bg-card ring-2 ring-primary/10"
          >
            {renderMapInstance({ miniMapId: map.id, isMainMap: false })}
            
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              <div className="bg-primary px-1.5 py-0.5 rounded shadow-sm text-[8px] font-bold text-white uppercase flex items-center gap-1">
                <Radar className="w-2 h-2" />
                {map.name}
              </div>
              <div className="bg-card/90 backdrop-blur-sm px-1.5 py-0.5 rounded border shadow-sm text-[8px] font-bold text-foreground uppercase">
                {map.vehicleIds.length} unidades
              </div>
            </div>

            <div className="absolute top-2 right-2 z-20 flex flex-col gap-2">
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-7 w-7 shadow-lg hover:scale-110 transition-transform bg-card/90 border-2 border-primary/20"
                        onClick={() => handleFocus(map.id)}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowLeftRight className="h-4 w-4 text-primary" />}
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Intercambiar con Mapa Principal</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-7 w-7 shadow-lg hover:scale-110 transition-transform bg-card/90 border-2 border-primary/20"
                        onClick={() => handleToggle(map.id)}
                        disabled={isPending}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Quitar del Mapa</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
