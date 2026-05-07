
'use client';

import React from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { Layers, Columns2, Rows2, Sun, Moon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SettingsPanelContent() {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isSplitView, splitDirection, isMapDark, miniMaps } = state;

  return (
    <div className="p-4 flex flex-col gap-2 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Configuración de Vista</h3>
      </div>
      
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start h-12 gap-3" onClick={() => dispatch({ type: 'TOGGLE_SPLIT_VIEW' })}>
          <Columns2 className={cn("w-5 h-5", isSplitView ? "text-primary" : "text-muted-foreground")} />
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold">{isSplitView ? 'Desactivar Split' : 'Vista Ida/Vuelta'}</span>
            <span className="text-[10px] text-muted-foreground">Dividir pantalla en dos trayectos</span>
          </div>
        </Button>

        {isSplitView && (
          <Button variant="outline" className="w-full justify-start h-12 gap-3 animate-in slide-in-from-top-2" onClick={() => dispatch({ type: 'TOGGLE_SPLIT_DIRECTION' })}>
            {splitDirection === 'horizontal' ? <Rows2 className="w-5 h-5" /> : <Columns2 className="w-5 h-5" />}
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold">Girar Orientación</span>
              <span className="text-[10px] text-muted-foreground">Cambiar entre horizontal/vertical</span>
            </div>
          </Button>
        )}

        <Button variant="outline" className="w-full justify-start h-12 gap-3" onClick={() => dispatch({ type: 'SET_MAP_DARK_MODE', payload: !isMapDark })}>
          {isMapDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-primary" />}
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold">Modo {isMapDark ? 'Claro' : 'Oscuro'}</span>
            <span className="text-[10px] text-muted-foreground">Cambiar el estilo visual del mapa</span>
          </div>
        </Button>
      </div>

      {miniMaps.length > 0 && (
        <div className="mt-auto pt-6 border-t">
          <Button variant="destructive" className="w-full h-12 gap-3" onClick={() => dispatch({ type: 'CLEAR_ALL_MINIMAPS' })}>
            <Trash2 className="w-5 h-5" />
            Limpiar todos los radares
          </Button>
        </div>
      )}
    </div>
  );
}
