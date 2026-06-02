'use client';

import React from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { Radar, X, ArrowLeftRight, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

const FleetMap = dynamic(() => import('../fleet-map').then(mod => mod.FleetMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export function MiniMapOverlayGrid({ apiKey }: { apiKey: string }) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { miniMaps, focusedMiniMapId } = state;

  const showOverviewAsMini = !!focusedMiniMapId;
  const filteredMiniMaps = miniMaps.filter(m => m.id !== focusedMiniMapId);

  if (!showOverviewAsMini && miniMaps.length === 0) return null;

  return (
    <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-4 pointer-events-none max-h-[75vh] overflow-y-auto pr-2 no-scrollbar">
      <AnimatePresence mode="popLayout">
        {/* 1. If focused, show the Overview map as a mini-map */}
        {showOverviewAsMini && (
          <motion.div 
            key="overview-mini"
            initial={{ x: 20, scale: 0.8, opacity: 0 }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            exit={{ x: 20, scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-auto relative w-48 sm:w-64 aspect-square border-2 rounded-2xl overflow-hidden shadow-2xl bg-card ring-2 ring-primary/20"
          >
            <FleetMap apiKey={apiKey} isOverview={false} />
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              <div className="bg-muted px-1.5 py-0.5 rounded shadow-sm text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                Vista General
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute top-2 right-2 h-7 w-7 z-20 shadow-lg hover:scale-110 transition-transform bg-card/90 border-2 border-primary/20"
                  onClick={() => dispatch({ type: 'UNFOCUS_MINIMAP' })}
                >
                  <RefreshCw className="h-4 h-4 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Restaurar General</TooltipContent>
            </Tooltip>
          </motion.div>
        )}

        {/* 2. Show the regular mini-map groups */}
        {filteredMiniMaps.map((map, index) => (
          <motion.div 
            key={map.id} 
            layout
            initial={{ x: 20, scale: 0.8, opacity: 0 }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            exit={{ x: 20, scale: 0.8, opacity: 0 }}
            transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                delay: index * 0.05
            }}
            className="pointer-events-auto relative w-48 sm:w-64 aspect-square border-2 rounded-2xl overflow-hidden shadow-2xl bg-card ring-2 ring-primary/10"
          >
            <FleetMap apiKey={apiKey} trackedVehicleIds={map.vehicleIds} isOverview={false} />
            
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
                    variant="destructive" 
                    size="icon" 
                    className="h-7 w-7 shadow-lg hover:scale-110 transition-transform"
                    onClick={() => dispatch({ type: 'REMOVE_MINIMAP', payload: map.id })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Eliminar Radar</TooltipContent>
              </Tooltip>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
