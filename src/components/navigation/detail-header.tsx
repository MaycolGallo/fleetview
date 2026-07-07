'use client';

import React, { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, X, LayoutGrid, Loader2 } from 'lucide-react';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { getMapFlags } from '@/context/fleet-selectors';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';
import { ClusteringToggle } from '@/components/map-controls/clustering-toggle';
import { cn } from '@/lib/utils';

export function DetailHeader({ apiKey }: { apiKey: string }) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isIncidenciasSheetOpen, isLoadingRoute, isLoadingIncidencias, focusedMiniMapId, miniMaps, historyVehicle } = state;
  const mapFlags = getMapFlags(state);
  const [isPending, startTransition] = useTransition();

  const handleBack = () => {
    startTransition(() => {
        // Priority sequence using early returns
        if (isIncidenciasSheetOpen) {
          dispatch({ type: 'CLOSE_INCIDENCIAS' });
          return;
        } 
        
        if (focusedMiniMapId) {
          dispatch({ type: 'UNFOCUS_MINIMAP' });
          return;
        } 
        
        dispatch({ type: 'BACK_TO_FLEET' });
    });
  };

  const handleRefresh = () => {
    if (!historyVehicle && !mapFlags.isRouteHistoryView) return;
    
    startTransition(() => {
        if (isIncidenciasSheetOpen && historyVehicle) {
          dispatch({ type: 'START_INCIDENCIAS_LOADING', payload: historyVehicle });
          return;
        } 
        
        if (historyVehicle) {
          dispatch({ type: 'START_ROUTE_LOADING', payload: historyVehicle });
        }
    });
  };

  const isBusy = isLoadingRoute || isLoadingIncidencias || isPending;
  const focusedGroup = focusedMiniMapId ? miniMaps.find(m => m.id === focusedMiniMapId) : null;

  return (
    <div className="absolute top-0 left-0 p-4 w-full pointer-events-none z-40">
      <div className="relative w-full h-12 flex justify-between items-center">
        <div className="flex gap-3 items-center pointer-events-auto">
          {(isIncidenciasSheetOpen || focusedMiniMapId || mapFlags.isRouteHistoryView) && (
            <Button
              onClick={handleBack}
              variant="secondary"
              disabled={isBusy}
              className="shadow-lg bg-card/90 backdrop-blur-sm font-bold border border-primary/20 h-10"
            >
              {isIncidenciasSheetOpen || focusedMiniMapId ? (
                <X className="mr-2 h-4 w-4" />
              ) : (
                <ArrowLeft className="mr-2 h-4 w-4" />
              )}
              {isIncidenciasSheetOpen
                ? 'Cerrar Incidencias'
                : focusedMiniMapId
                ? `Restaurar Vista General`
                : 'Volver'}
            </Button>
          )}

          {focusedGroup && mapFlags.isFocusedView && (
            <div className="bg-primary/10 backdrop-blur-sm border border-primary/20 px-4 h-10 rounded-lg flex items-center gap-2 shadow-sm text-sm font-bold animate-in slide-in-from-left-2">
              <LayoutGrid className="w-4 h-4 text-primary" />
              <span>
                Enfocado: <span className="text-primary">{focusedGroup.name}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center pointer-events-auto">
          <ClusteringToggle />
          {(historyVehicle || mapFlags.isRouteHistoryView) && (
            <>
              <Button
                variant="secondary"
                size="icon"
                disabled={isBusy}
                className={cn(
                  'shadow-lg bg-card/90 backdrop-blur-sm border border-primary/20 h-10 w-10 transition-all duration-300',
                  isBusy ? 'cursor-not-allowed opacity-80' : 'hover:scale-110 active:rotate-180'
                )}
                onClick={handleRefresh}
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={handleBack}
                variant="secondary"
                size="icon"
                disabled={isBusy}
                className="shadow-lg bg-card/90 backdrop-blur-sm border border-primary/20 h-10 w-10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </>
          )}
          <NotificationsDropdown apiKey={apiKey} />
        </div>
      </div>
    </div>
  );
}
