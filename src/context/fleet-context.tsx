
'use client';

import React, { createContext, useContext, useEffect, useRef, useSyncExternalStore, type Dispatch } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import type { Vehicle, FleetState, MiniMapGroup, Notification, MapProvider } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { fleetReducer, getInitialState, type FleetAction } from './fleet-reducer';
import { fetchVehicles, fetchRouteHistory, fetchIncidencias, fetchMiniMaps } from '@/services/fleet-api';

const STORAGE_KEY = 'fleet_minimaps_state_v2';

interface FleetStateContextValue {
    store: FleetStore;
    isLoadingVehicles: boolean;
    error: Error | null;
}

interface FleetStore {
    getState: () => FleetState;
    subscribe: (listener: () => void) => () => void;
    dispatch: Dispatch<FleetAction>;
}

const FleetStateContext = createContext<FleetStore | undefined>(undefined);
const FleetDispatchContext = createContext<Dispatch<FleetAction> | undefined>(undefined);

function createFleetStore(): FleetStore {
    let state = getInitialState();
    const listeners = new Set<() => void>();

    return {
        getState: () => state,
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        dispatch: (action) => {
            const nextState = fleetReducer(state, action);
            if (Object.is(nextState, state)) return;
            state = nextState;
            listeners.forEach((listener) => listener());
        },
    };
}

export const FleetProvider = ({ children }: { children: React.ReactNode }) => {
    const storeRef = useRef<FleetStore | null>(null);
    if (!storeRef.current) storeRef.current = createFleetStore();
    const store = storeRef.current;
    const state = useSyncExternalStore(store.subscribe, store.getState, getInitialState);
    const dispatch = store.dispatch;
    const searchParams = useSearchParams();

    // 1. Sync Theme (Dark Mode) to Document Root
    useEffect(() => {
        if (state.isMapDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [state.isMapDark]);

    // 2. Sync Map Provider from URL on Mount and URL change
    useEffect(() => {
        const urlMap = searchParams.get('map') as MapProvider;
        const validProviders: MapProvider[] = ['google', 'leaflet', 'mapbox'];
        if (urlMap && validProviders.includes(urlMap) && urlMap !== state.mapProvider) {
            dispatch({ type: 'SET_MAP_PROVIDER', payload: urlMap });
        }
    }, [searchParams, state.mapProvider]);

    const { data: rawVehiclesData, isLoading: isLoadingVehicles, error } = useQuery({
      queryKey: ['vehicles'],
      queryFn: fetchVehicles,
      refetchInterval: 30000,
      staleTime: 1000 * 30,
    });

    const { data: miniMapsData } = useQuery({
        queryKey: ['minimaps'],
        queryFn: fetchMiniMaps,
        staleTime: 1000 * 60 * 5,
    });

    const routeQuery = useQuery({
      queryKey: ['route-history', state.historyVehicle?.id_vehiculo],
      queryFn: () => fetchRouteHistory(state.historyVehicle!.id_vehiculo),
      enabled: !!state.historyVehicle && state.isLoadingRoute,
    });

    const incidenciasQuery = useQuery({
      queryKey: ['incidencias-history', state.historyVehicle?.id_vehiculo],
      queryFn: () => fetchIncidencias(state.historyVehicle!.id_vehiculo),
      enabled: !!state.historyVehicle && state.isLoadingIncidencias,
    });

    useEffect(() => {
        if (miniMapsData) {
            dispatch({ type: 'SET_MINIMAPS', payload: miniMapsData });
        }
    }, [miniMapsData]);

    useEffect(() => {
      if (routeQuery.data) dispatch({ type: 'SET_ROUTE_HISTORY', payload: routeQuery.data });
    }, [routeQuery.data]);

    useEffect(() => {
      if (incidenciasQuery.data) dispatch({ type: 'SET_INCIDENCIAS', payload: incidenciasQuery.data });
    }, [incidenciasQuery.data]);

    useEffect(() => {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed && typeof parsed === 'object') {
             dispatch({ type: 'INIT_PERSISTED_STATE', payload: { 
               miniMaps: parsed.miniMaps || [], 
               visibleIds: parsed.visibleIds || [] 
             }});
          }
        } catch (e) { console.error("Failed to load persisted state", e); }
      }
    }, []);

    useEffect(() => {
      if (state.miniMaps.length > 0 || state.visibleMiniMapIds.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          miniMaps: state.miniMaps,
          visibleIds: state.visibleMiniMapIds
        }));
      }
    }, [state.miniMaps, state.visibleMiniMapIds]);
    
    useEffect(() => {
      if (rawVehiclesData) {
        const processedVehicles: Vehicle[] = rawVehiclesData.map(raw => {
          const [lat, lng] = raw.coordenadas.split(',').map(Number);
          return {
            id_ubicacion: raw.id_ubicacion,
            id_vehiculo: raw.id_vehiculo,
            lat, lng,
            id_estado: raw.id_estado,
            fecha: raw.fecha,
            velocidad: raw.velocidad,
            rumbo: raw.rumbo,
            odometro: raw.odometro,
            senal_gsm: raw.senal_gsm,
            nivel_bateria_vehicular: raw.nivel_bateria_vehicular,
            placa: raw.vehiculo.vehiculo_placa,
            statusName: raw.estado.param1,
            statusColor: raw.estado.param3,
          };
        });
        dispatch({ type: 'SET_VEHICLES', payload: processedVehicles });
      }
    }, [rawVehiclesData]);

    // Preview-only movement loop: feeds changing coordinates into the animation hook.
    // Remove or gate this effect with a feature flag when real telemetry is connected.
    useEffect(() => {
      if (process.env.NODE_ENV !== 'development' || state.vehicles.length === 0) return;

      const timer = setInterval(() => {
        dispatch({ type: 'SIMULATE_VEHICLE_MOVE', payload: 1 });
      }, 2000);

      return () => clearInterval(timer);
    }, [state.vehicles.length]);

    // Simulated incident ticker
    useEffect(() => {
      if (state.vehicles.length === 0) return;
      const timer = setInterval(() => {
        if (Math.random() > 0.95) {
          const randomVehicle = state.vehicles[Math.floor(Math.random() * state.vehicles.length)];
          const incident: Notification = {
            id: `noti-${Date.now()}`,
            type: 'panic',
            lat: randomVehicle.lat + (Math.random() - 0.5) * 0.01,
            lng: randomVehicle.lng + (Math.random() - 0.5) * 0.01,
            timestamp: Math.floor(Date.now() / 1000),
            description: 'Botón de Pánico Activado',
            placa: randomVehicle.placa,
            isRead: false,
          };
          dispatch({ type: 'ADD_NOTIFICATION', payload: incident });
          toast({ title: "Nueva Incidencia", description: `Boton de Panico: ${incident.placa}`, variant: 'destructive' });
        }
      }, 45000); 
      return () => clearInterval(timer);
    }, [state.vehicles]);

    return (
        <FleetStateContext.Provider value={{
            store,
            isLoadingVehicles: isLoadingVehicles && state.vehicles.length === 0,
            error: error ?? null,
        }}>
            <FleetDispatchContext.Provider value={dispatch}>
                {children}
            </FleetDispatchContext.Provider>
        </FleetStateContext.Provider>
    );
};

export const useFleetState = () => {
    const context = useContext(FleetStateContext);
    if (!context) throw new Error('useFleetState must be used within a FleetProvider');

    const state = useSyncExternalStore(
        context.store.subscribe,
        context.store.getState,
        getInitialState,
    );

    return {
        state,
        isLoadingVehicles: context.isLoadingVehicles,
        error: context.error,
    };
};

export const useFleetDispatch = () => {
    const context = useContext(FleetDispatchContext);
    if (!context) throw new Error('useFleetDispatch must be used within a FleetProvider');
    return context;
};

export { selectVisibleVehicles, selectFilteredVehicles, selectMapVehicles, selectRouteSummary } from './fleet-selectors';
