'use client';

import React from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { Radar, X, ArrowLeftRight, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

const FleetMap = dynamic(() => import('../fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export function MiniMapOverlayGrid({ apiKey }: { apiKey: string }) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { miniMaps, visibleMiniMapIds, focusedMiniMapId } = state;

  const showOverviewAsMini = !!focusedMiniMapId;
  const activeMiniMaps = miniMaps.filter(m => visibleMiniMapIds.includes(m.id) && m.id !== focusedMiniMapId);

  // We keep the container mounted so AnimatePresence can handle the exit of the LAST item.
  // The container is pointer-events-none so it doesn't block map interactions.

  return (
    <div className="absolute bottom-6 right-6 z-30 flex flex-col-reverse flex-wrap-reverse items-end justify-start gap-4 pointer-events-none h-[80vh] overflow-visible">
      <AnimatePresence mode="popLayout">
        {showOverviewAsMini && (
          <motion.div 
            key="overview-mini"
            layout
            initial={{ x: 100, scale: 0.8, opacity: 0 }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            exit={{ x: 100, scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="pointer-events-auto relative flex-grow shrink-0 min-h-[calc(20vh-16px)] max-h-[calc(40vh-16px)] w-96 border-2 rounded-2xl overflow-hidden shadow-2xl bg-card ring-2 ring-primary/20"
          >
            <FleetMap apiKey={apiKey} isMainMap={false} />
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
                    onClick={() => dispatch({ type: 'UNFOCUS_MINIMAP' })}
                    >
                    <RefreshCw className="h-4 w-4 text-primary" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Restaurar General</TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}

        {activeMiniMaps.map((map) => (
          <motion.div 
            key={map.id} 
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
            <FleetMap apiKey={apiKey} trackedVehicleIds={map.vehicleIds} isMainMap={false} />
            
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
                        onClick={() => dispatch({ type: 'FOCUS_MINIMAP', payload: map.id })}
                    >
                        <ArrowLeftRight className="h-4 w-4 text-primary" />
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
                        onClick={() => dispatch({ type: 'TOGGLE_MINIMAP_VISIBILITY', payload: map.id })}
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