
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, X, LayoutGrid } from 'lucide-react';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';

export function DetailHeader({ apiKey }: { apiKey: string }) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isIncidenciasSheetOpen, isLoadingRoute, isLoadingIncidencias, focusedMiniMapId, miniMaps } = state;

  const handleBack = () => {
    if (isIncidenciasSheetOpen) {
      dispatch({ type: 'CLOSE_INCIDENCIAS' });
    } else if (focusedMiniMapId) {
      dispatch({ type: 'UNFOCUS_MINIMAP' });
    } else {
      dispatch({ type: 'BACK_TO_FLEET' });
    }
  };

  const isBusy = isLoadingRoute || isLoadingIncidencias;
  const focusedGroup = focusedMiniMapId ? miniMaps.find(m => m.id === focusedMiniMapId) : null;

  return (
    <div className="absolute top-0 left-0 p-4 w-full pointer-events-none z-40">
      <div className="relative w-full h-12 flex justify-between items-center">
        <div className="flex gap-3 items-center pointer-events-auto">
          {!isBusy && (
            <Button onClick={handleBack} variant="secondary" className="shadow-lg bg-card/90 backdrop-blur-sm font-bold border border-primary/20 h-10">
              {isIncidenciasSheetOpen || focusedMiniMapId ? <X className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
              {isIncidenciasSheetOpen ? 'Cerrar Incidencias' : focusedMiniMapId ? `Restaurar Vista General` : 'Volver'}
            </Button>
          )}
          {focusedGroup && (
            <div className="bg-primary/10 backdrop-blur-sm border border-primary/20 px-4 h-10 rounded-lg flex items-center gap-2 shadow-sm text-sm font-bold animate-in slide-in-from-left-2">
              <LayoutGrid className="w-4 h-4 text-primary" />
              <span>Enfocado: <span className="text-primary">{focusedGroup.name}</span></span>
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center pointer-events-auto">
          {!isIncidenciasSheetOpen && !isBusy && !focusedMiniMapId && (
            <Button variant="secondary" size="icon" className="shadow-lg bg-card/90 backdrop-blur-sm border border-primary/20 h-10 w-10">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <NotificationsDropdown apiKey={apiKey} />
        </div>
      </div>
      {isBusy && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-[100] pointer-events-auto">
          <div className="flex items-center gap-3 text-foreground bg-card p-6 rounded-xl shadow-2xl border">
            <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            <p className="font-bold text-lg">{isLoadingIncidencias ? 'Cargando incidencias...' : 'Generando ruta...'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
