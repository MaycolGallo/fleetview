
'use client';

import React from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { Button } from '@/components/ui/button';
import { Layers, Columns2, Rows2, Sun, Moon, Trash2, Map as MapIcon, Globe, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { MapProvider } from '@/lib/types';

export function SettingsPanelContent() {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isSplitView, splitDirection, isMapDark, miniMaps, mapProvider } = state;
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleProviderChange = (val: string) => {
    const provider = val as MapProvider;
    dispatch({ type: 'SET_MAP_PROVIDER', payload: provider });
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('map', provider);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleDarkMode = () => {
    dispatch({ type: 'SET_MAP_DARK_MODE', payload: !isMapDark });
  };

  return (
    <div className="p-4 flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Proveedor de Mapas</h3>
        </div>
        <Tabs value={mapProvider} onValueChange={handleProviderChange}>
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="google" className="gap-2 text-[10px]">
                    <MapIcon className="w-3 h-3" /> Google
                </TabsTrigger>
                <TabsTrigger value="leaflet" className="gap-2 text-[10px]">
                    <Layers className="w-3 h-3" /> Leaflet
                </TabsTrigger>
                <TabsTrigger value="mapbox" className="gap-2 text-[10px]">
                    <Navigation className="w-3 h-3" /> Mapbox
                </TabsTrigger>
            </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
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

            <Button variant="outline" className="w-full justify-start h-12 gap-3" onClick={toggleDarkMode}>
            {isMapDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-primary" />}
            <div className="flex flex-col items-start">
                <span className="text-sm font-bold">Modo {isMapDark ? 'Claro' : 'Oscuro'}</span>
                <span className="text-[10px] text-muted-foreground">Cambiar el estilo visual del mapa</span>
            </div>
            </Button>
        </div>
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
