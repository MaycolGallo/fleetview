'use client';

import React, { createContext, useContext, useReducer, useEffect, type Dispatch, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Vehicle, FleetState, MiniMapGroup, Notification } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { fleetReducer, getInitialState, type FleetAction } from './fleet-reducer';
import { fetchVehicles, fetchRouteHistory, fetchIncidencias, fetchMiniMaps } from '@/services/fleet-api';

const STORAGE_KEY = 'fleet_minimaps_state';

interface FleetStateContextValue {
    state: FleetState;
    isLoadingVehicles: boolean;
    error: Error | null;
}

const FleetStateContext = createContext<FleetStateContextValue | undefined>(undefined);
const FleetDispatchContext = createContext<Dispatch<FleetAction> | undefined>(undefined);

export const FleetProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(fleetReducer, getInitialState());

    const { data: rawVehiclesData, isLoading: isLoadingVehicles, error } = useQuery({
      queryKey: ['vehicles'],
      queryFn: fetchVehicles,
      refetchInterval: 30000,
      staleTime: 1000 * 30,
    });

    const { data: miniMapsData } = useQuery({
        queryKey: ['minimaps'],
        queryFn: fetchMiniMaps,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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
          if (Array.isArray(parsed)) dispatch({ type: 'INIT_PERSISTED_STATE', payload: parsed });
        } catch (e) { console.error("Failed to load persisted state", e); }
      }
    }, []);

    useEffect(() => {
      if (state.miniMaps.length > 0 || state.trackedVehicleIds.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.miniMaps));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }, [state.miniMaps, state.trackedVehicleIds]);
    
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

    const stateContextValue = useMemo(() => ({
        state,
        isLoadingVehicles: isLoadingVehicles && state.vehicles.length === 0,
        error,
    }), [state, isLoadingVehicles, error]);

    return (
        <FleetStateContext.Provider value={stateContextValue}>
            <FleetDispatchContext.Provider value={dispatch}>
                {children}
            </FleetDispatchContext.Provider>
        </FleetStateContext.Provider>
    );
};

export const useFleetState = () => {
    const context = useContext(FleetStateContext);
    if (!context) throw new Error('useFleetState must be used within a FleetProvider');
    return context;
};

export const useFleetDispatch = () => {
    const context = useContext(FleetDispatchContext);
    if (!context) throw new Error('useFleetDispatch must be used within a FleetProvider');
    return context;
};

export { selectVisibleVehicles, selectFilteredVehicles, selectMapVehicles, selectRouteSummary } from './fleet-selectors';
