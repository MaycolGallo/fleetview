
'use client';

import { createContext, useContext, useReducer, useEffect, type Dispatch, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Vehicle, RawVehicle, VehicleStatus, VehiculoHistorialGrouped, VHistorial, MapViewport, FleetState, Incidencia, Notification, MiniMapGroup } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

const fetchVehicles = async (): Promise<RawVehicle[]> => {
  const res = await fetch('/api/vehicles');
  if (!res.ok) {
    throw new Error('Failed to fetch vehicles');
  }
  return res.json();
};

const SIMULATION_ROUTE = [
  { lat: -12.045, lng: -77.040 },
  { lat: -12.048, lng: -77.042 },
  { lat: -12.050, lng: -77.038 },
  { lat: -12.047, lng: -77.036 },
];

const MASTER_FLEET_ROUTE = [
    { lat: -12.030, lng: -77.020 },
    { lat: -12.040, lng: -77.035 },
    { lat: -12.046, lng: -77.042 },
    { lat: -12.055, lng: -77.050 },
    { lat: -12.065, lng: -77.065 },
    { lat: -12.080, lng: -77.075 },
    { lat: -12.100, lng: -77.085 },
];

type FleetAction =
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'SET_STATUS_FILTER'; payload: VehicleStatus[] }
  | { type: 'PAN_TO_VEHICLE'; payload: Vehicle | null }
  | { type: 'START_ROUTE_LOADING'; payload: Vehicle }
  | { type: 'SET_ROUTE_HISTORY'; payload: VHistorial }
  | { type: 'BACK_TO_FLEET' }
  | { type: 'SELECT_ROUTE_SEGMENT'; payload: number }
  | { type: 'SET_ROUTE_SHEET_OPEN', payload: boolean }
  | { type: 'TOGGLE_VEHICLE_VISIBILITY', payload: number }
  | { type: 'CREATE_MINIMAP', payload: { vehicleId: number } }
  | { type: 'REMOVE_MINIMAP', payload: string }
  | { type: 'ADD_VEHICLE_TO_MINIMAP', payload: { miniMapId: string, vehicleId: number } }
  | { type: 'REMOVE_VEHICLE_FROM_MINIMAP', payload: { miniMapId: string, vehicleId: number } }
  | { type: 'CLEAR_ALL_MINIMAPS' }
  | { type: 'SET_ALL_VEHICLES_VISIBILITY', payload: { ids: number[], visible: boolean } }
  | { type: 'SET_MAP_DARK_MODE', payload: boolean }
  | { type: 'SET_PIN_ROTATION_MODE', payload: 'arrow' | 'pin' }
  | { type: 'SIMULATE_VEHICLE_MOVE', payload: number }
  | { type: 'VIEWPORT_ACTION_COMPLETE' }
  | { type: 'START_ROUTE_PLAYBACK' }
  | { type: 'PAUSE_ROUTE_PLAYBACK' }
  | { type: 'TOGGLE_SPLIT_VIEW' }
  | { type: 'TOGGLE_SPLIT_DIRECTION' }
  | { type: 'UPDATE_HISTORY_VEHICLE_POSITION', payload: { lat: number, lng: number, rumbo: number, velocidad: number, animationDuration: number } }
  | { type: 'START_INCIDENCIAS_LOADING'; payload: Vehicle }
  | { type: 'SET_INCIDENCIAS'; payload: Incidencia[] }
  | { type: 'SELECT_INCIDENCIA'; payload: string | null }
  | { type: 'CLOSE_INCIDENCIAS' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'TOGGLE_TRACK_VEHICLE'; payload: number };

const getInitialState = (): FleetState => ({
  vehicles: [],
  statusFilter: [],
  selectedVehicle: null,
  historyVehicle: null,
  routePath: null,
  routeGroups: [],
  by_estado: {},
  isRouteSheetOpen: false,
  isLoadingRoute: false,
  selectedSegmentIndex: null,
  visibleVehicleIds: new Set(),
  miniMaps: [],
  trackedVehicleIds: [],
  isMapDark: false,
  mapViewport: { type: 'initial' },
  simulationStep: {},
  pinRotationMode: 'arrow',
  isRoutePlaying: false,
  playbackAnimationDuration: 1000,
  isSplitView: false,
  splitDirection: 'horizontal',
  wasSplitViewBeforeRoute: false,
  incidencias: [],
  isLoadingIncidencias: false,
  isIncidenciasSheetOpen: false,
  selectedIncidenciaId: null,
  notifications: [],
  masterRoute: MASTER_FLEET_ROUTE,
});

const getTrackedIds = (miniMaps: MiniMapGroup[]) => {
  const ids = new Set<number>();
  miniMaps.forEach(m => m.vehicleIds.forEach(id => ids.add(id)));
  return Array.from(ids);
};

const fleetReducer = (state: FleetState, action: FleetAction): FleetState => {
  switch (action.type) {
    case 'SET_VEHICLES': {
      const newVisibleIds = state.vehicles.length === 0 
        ? new Set(action.payload.map(v => v.id_vehiculo))
        : state.visibleVehicleIds;
    
      const visibleVehicles = action.payload.filter(v => newVisibleIds.has(v.id_vehiculo));

      const newBounds = visibleVehicles.length > 0
          ? visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng }))
          : [];

      const updatedSelectedVehicle = state.selectedVehicle
        ? action.payload.find(v => v.id_vehiculo === state.selectedVehicle!.id_vehiculo) || null
        : null;

       return {
         ...state,
         vehicles: action.payload,
         selectedVehicle: updatedSelectedVehicle,
         visibleVehicleIds: newVisibleIds,
         mapViewport: state.mapViewport.type === 'initial' && newBounds.length > 0 
          ? { type: 'fit_bounds', payload: newBounds } 
          : state.mapViewport,
       };
    }
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload };
    
    case 'PAN_TO_VEHICLE': {
      if (action.payload === null) {
        return { ...state, selectedVehicle: null };
      }
      return {
        ...state,
        selectedVehicle: action.payload,
        mapViewport: { type: 'pan_to_vehicle', payload: { lat: action.payload.lat, lng: action.payload.lng } }
      };
    }

    case 'SET_ROUTE_SHEET_OPEN':
      return { ...state, isRouteSheetOpen: action.payload };

    case 'START_ROUTE_LOADING':
      return {
        ...state,
        selectedVehicle: null,
        isLoadingRoute: true,
        historyVehicle: action.payload,
        isIncidenciasSheetOpen: false,
        wasSplitViewBeforeRoute: state.isSplitView,
        isSplitView: false, 
      };

    case 'SET_ROUTE_HISTORY': {
        const historyData = action.payload;
        const filteredGroups = historyData.groups.filter(group => group.total_time_seconds > 60);
        const routePoints = filteredGroups
          .filter(g => g.id_estado === 6)
          .map(g => g.records.map(r => ({ lat: r.lat, lng: r.lng })));

        const startOfRoute = filteredGroups?.[0]?.records?.[0];
        const updatedHistoryVehicle = state.historyVehicle && startOfRoute
            ? { ...state.historyVehicle, lat: startOfRoute.lat, lng: startOfRoute.lng, rumbo: startOfRoute?.rumbo || 0, velocidad: "0" }
            : state.historyVehicle;
        
        return {
            ...state,
            isLoadingRoute: false,
            routePath: routePoints,
            routeGroups: filteredGroups,
            by_estado: historyData.by_estado,
            isRouteSheetOpen: !state.isLoadingIncidencias && !state.isIncidenciasSheetOpen,
            historyVehicle: updatedHistoryVehicle,
            isRoutePlaying: false,
            mapViewport: state.isIncidenciasSheetOpen 
              ? state.mapViewport 
              : { type: 'fit_route', payload: routePoints.flat() },
        };
    }

    case 'BACK_TO_FLEET': {
        const visibleVehicles = state.vehicles.filter(v => state.visibleVehicleIds.has(v.id_vehiculo));
        const newBounds = visibleVehicles.length > 0
            ? visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng }))
            : [];
        
        return {
            ...state,
            historyVehicle: null,
            routePath: null,
            routeGroups: [],
            by_estado: {},
            selectedVehicle: null,
            isRouteSheetOpen: false,
            selectedSegmentIndex: null,
            isLoadingRoute: false,
            isRoutePlaying: false,
            isSplitView: state.wasSplitViewBeforeRoute, 
            wasSplitViewBeforeRoute: false,
            mapViewport: { type: 'fit_bounds', payload: newBounds },
        };
    }

    case 'SELECT_ROUTE_SEGMENT': {
      const segmentIndex = action.payload;
      const { selectedSegmentIndex, routeGroups, historyVehicle } = state;
      
      if (!historyVehicle) return state;

      if (selectedSegmentIndex === segmentIndex) {
        const startOfRoute = routeGroups?.[0]?.records?.[0];
        return {
          ...state,
          selectedSegmentIndex: null,
          historyVehicle: startOfRoute ? { ...historyVehicle, lat: startOfRoute.lat, lng: startOfRoute.lng } : historyVehicle,
          mapViewport: { type: 'fit_route', payload: state.routePath?.flat() || [] },
        };
      }

      const segmentToSelect = routeGroups[segmentIndex];
      if (!segmentToSelect?.records?.length) return state;
      
      const lastRecord = segmentToSelect.records[segmentToSelect.records.length - 1];
      
      const updatedVehicle = {
        ...historyVehicle,
        lat: lastRecord.lat,
        lng: lastRecord.lng,
        id_estado: segmentToSelect.id_estado,
        velocidad: String(Math.round(segmentToSelect.avg_velocidad)),
        rumbo: lastRecord.rumbo || historyVehicle.rumbo,
        statusName: segmentToSelect.description,
        statusColor: segmentToSelect.color || historyVehicle.statusColor,
      };

      let newMapViewport: MapViewport;
      if (segmentToSelect.id_estado === 6) {
        const segmentPoints = segmentToSelect.records.map(r => ({ lat: r.lat, lng: r.lng }));
        newMapViewport = segmentPoints.length > 0 ? { type: 'fit_bounds', payload: segmentPoints } : state.mapViewport;
      } else {
        newMapViewport = { type: 'pan_to_vehicle', payload: { lat: lastRecord.lat, lng: lastRecord.lng }};
      }

      return {
        ...state,
        selectedSegmentIndex: segmentIndex,
        historyVehicle: updatedVehicle,
        mapViewport: newMapViewport,
      };
    }

    case 'START_INCIDENCIAS_LOADING':
      return {
        ...state,
        selectedVehicle: null,
        isLoadingIncidencias: true,
        isLoadingRoute: false,
        historyVehicle: action.payload,
        isRouteSheetOpen: false,
        isIncidenciasSheetOpen: false,
        wasSplitViewBeforeRoute: state.isSplitView,
        isSplitView: false,
      };

    case 'SET_INCIDENCIAS':
      return {
        ...state,
        isLoadingIncidencias: false,
        incidencias: action.payload,
        isIncidenciasSheetOpen: true,
        mapViewport: { type: 'fit_bounds', payload: action.payload.map(i => ({ lat: i.lat, lng: i.lng })) },
      };

    case 'SELECT_INCIDENCIA': {
      if (action.payload === null) return { ...state, selectedIncidenciaId: null };
      
      const inc = state.incidencias.find(i => i.id === action.payload);
      
      return {
        ...state,
        selectedIncidenciaId: action.payload,
        mapViewport: inc ? { type: 'pan_to_vehicle', payload: { lat: inc.lat, lng: inc.lng } } : state.mapViewport,
      };
    }

    case 'CLOSE_INCIDENCIAS':
      return {
        ...state,
        historyVehicle: null,
        routePath: null,
        routeGroups: [],
        incidencias: [],
        isIncidenciasSheetOpen: false,
        isLoadingIncidencias: false,
        isLoadingRoute: false,
        selectedIncidenciaId: null,
        isSplitView: state.wasSplitViewBeforeRoute,
        mapViewport: { type: 'fit_bounds', payload: state.vehicles.map(v => ({ lat: v.lat, lng: v.lng })) },
      };

    case 'TOGGLE_VEHICLE_VISIBILITY': {
        const newVisibleIds = new Set(state.visibleVehicleIds);
        if (newVisibleIds.has(action.payload)) {
            newVisibleIds.delete(action.payload);
        } else {
            newVisibleIds.add(action.payload);
        }
        return { ...state, visibleVehicleIds: newVisibleIds };
    }

    case 'CREATE_MINIMAP': {
      const newMap: MiniMapGroup = {
        id: `map-${Date.now()}`,
        name: `Radar Lock ${state.miniMaps.length + 1}`,
        vehicleIds: [action.payload.vehicleId]
      };
      const newMaps = [...state.miniMaps, newMap];
      return { ...state, miniMaps: newMaps, trackedVehicleIds: getTrackedIds(newMaps) };
    }

    case 'REMOVE_MINIMAP': {
      const newMaps = state.miniMaps.filter(m => m.id !== action.payload);
      return { ...state, miniMaps: newMaps, trackedVehicleIds: getTrackedIds(newMaps) };
    }

    case 'ADD_VEHICLE_TO_MINIMAP': {
      const newMaps = state.miniMaps.map(m => 
        m.id === action.payload.miniMapId 
          ? { ...m, vehicleIds: Array.from(new Set([...m.vehicleIds, action.payload.vehicleId])) }
          : m
      );
      return { ...state, miniMaps: newMaps, trackedVehicleIds: getTrackedIds(newMaps) };
    }

    case 'REMOVE_VEHICLE_FROM_MINIMAP': {
      const newMaps = state.miniMaps.map(m => 
        m.id === action.payload.miniMapId 
          ? { ...m, vehicleIds: m.vehicleIds.filter(id => id !== action.payload.vehicleId) }
          : m
      );
      return { ...state, miniMaps: newMaps, trackedVehicleIds: getTrackedIds(newMaps) };
    }

    case 'CLEAR_ALL_MINIMAPS':
      return { ...state, miniMaps: [], trackedVehicleIds: [] };

    case 'TOGGLE_TRACK_VEHICLE': {
      const isAlreadyTracked = state.trackedVehicleIds?.includes(action.payload) || false;
      if (isAlreadyTracked) {
        const newMaps = state.miniMaps.map(m => ({
          ...m,
          vehicleIds: m.vehicleIds.filter(id => id !== action.payload)
        })).filter(m => m.vehicleIds.length > 0);
        return { ...state, miniMaps: newMaps, trackedVehicleIds: getTrackedIds(newMaps) };
      } else {
        const newMap: MiniMapGroup = {
          id: `map-${Date.now()}`,
          name: `Radar Lock ${state.miniMaps.length + 1}`,
          vehicleIds: [action.payload]
        };
        const newMaps = [...state.miniMaps, newMap];
        return { ...state, miniMaps: newMaps, trackedVehicleIds: getTrackedIds(newMaps) };
      }
    }

    case 'SET_ALL_VEHICLES_VISIBILITY': {
        const newVisibleIds = new Set(state.visibleVehicleIds);
        if (action.payload.visible) {
            action.payload.ids.forEach(id => newVisibleIds.add(id));
        } else {
            action.payload.ids.forEach(id => {
              newVisibleIds.delete(id);
            });
        }
        return { ...state, visibleVehicleIds: newVisibleIds };
    }
    
    case 'SET_MAP_DARK_MODE': {
      return { ...state, isMapDark: action.payload };
    }

    case 'SET_PIN_ROTATION_MODE': {
      return { ...state, pinRotationMode: action.payload };
    }

    case 'SIMULATE_VEHICLE_MOVE': {
      const vehicleId = action.payload;
      const currentStep = state.simulationStep[vehicleId] || 0;
      const nextStep = (currentStep + 1) % SIMULATION_ROUTE.length;
      const newCoords = SIMULATION_ROUTE[nextStep];

      return {
        ...state,
        vehicles: state.vehicles.map(v => 
          v.id_vehiculo === vehicleId
            ? { ...v, lat: newCoords.lat, lng: newCoords.lng }
            : v
        ),
        simulationStep: {
          ...state.simulationStep,
          [vehicleId]: nextStep
        }
      };
    }

    case 'VIEWPORT_ACTION_COMPLETE': {
        return { ...state, mapViewport: { type: 'idle' } };
    }

    case 'START_ROUTE_PLAYBACK':
        return {
            ...state,
            isRoutePlaying: true,
            historyVehicle: state.historyVehicle ? { ...state.historyVehicle, id_estado: 6 } : state.historyVehicle,
        };

    case 'PAUSE_ROUTE_PLAYBACK':
        return {
            ...state,
            isRoutePlaying: false,
        };

    case 'TOGGLE_SPLIT_VIEW':
        return {
            ...state,
            isSplitView: !state.isSplitView,
        };

    case 'TOGGLE_SPLIT_DIRECTION':
        return {
            ...state,
            splitDirection: state.splitDirection === 'horizontal' ? 'vertical' : 'horizontal',
        };

    case 'UPDATE_HISTORY_VEHICLE_POSITION': {
        if (!state.historyVehicle) return state;
        const { lat, lng, rumbo, velocidad, animationDuration } = action.payload;
        
        return {
            ...state,
            historyVehicle: {
                ...state.historyVehicle,
                lat,
                lng,
                rumbo,
                velocidad: String(velocidad),
                id_estado: 6,
                statusName: 'Transitando',
                statusColor: '#00CC33',
            },
            playbackAnimationDuration: animationDuration,
        };
    }

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50),
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => n.id === action.payload ? { ...n, isRead: true } : n),
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };

    default:
      return state;
  }
};

export const selectVisibleVehicles = (state: FleetState): Vehicle[] => {
  return state.vehicles.filter(v => state.visibleVehicleIds.has(v.id_vehiculo));
};

export const selectFilteredVehicles = (state: FleetState): Vehicle[] => {
  const visibleVehicles = selectVisibleVehicles(state);
  if (state.statusFilter.length === 0) {
    return visibleVehicles;
  }
  return visibleVehicles.filter(v => state.statusFilter.includes(String(v.id_estado)));
};

export const selectMapVehicles = (state: FleetState, trackedIds?: number[]): Vehicle[] => {
  if (state.historyVehicle) {
    return [state.historyVehicle];
  }
  
  if (trackedIds && trackedIds.length > 0) {
    // Mini-map view: Show specifically assigned vehicles regardless of main visibility toggle
    return state.vehicles.filter(v => trackedIds.includes(v.id_vehiculo));
  }

  // Main map view: Show vehicles based on visibility toggle and filters
  const filtered = selectFilteredVehicles(state);
  return filtered;
};

export const selectRouteSummary = (state: FleetState) => {
  const { routeGroups } = state;
  if (!routeGroups || routeGroups.length === 0) {
    return { totalDistance: 0, totalDuration: 0, totalStops: 0, totalStopTime: 0 };
  }

  return routeGroups.reduce(
    (summary, group) => {
      summary.totalDistance += group.total_distance_km;
      summary.totalDuration += group.total_time_seconds / 60;
      if (group.id_estado === 5) {
        summary.totalStops += 1;
        summary.totalStopTime += group.total_time_seconds / 60;
      }
      return summary;
    },
    { totalDistance: 0, totalDuration: 0, totalStops: 0, totalStopTime: 0 }
  );
};

interface FleetStateContextValue {
    state: FleetState;
    isLoadingVehicles: boolean;
    error: Error | null;
}

const FleetStateContext = createContext<FleetStateContextValue | undefined>(undefined);
const FleetDispatchContext = createContext<Dispatch<FleetAction> | undefined>(undefined);

export const FleetProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(fleetReducer, getInitialState());

    const {
      data: rawVehiclesData,
      isLoading: isLoadingVehicles,
      error,
    } = useQuery<RawVehicle[], Error>({
      queryKey: ['vehicles'],
      queryFn: fetchVehicles,
      refetchOnWindowFocus: false, 
      staleTime: 1000 * 60 * 5, 
    });
    
    useEffect(() => {
      if (rawVehiclesData) {
        const processedVehicles: Vehicle[] = rawVehiclesData.map(raw => {
          const [lat, lng] = raw.coordenadas.split(',').map(Number);
          return {
            id_ubicacion: raw.id_ubicacion,
            id_vehiculo: raw.id_vehiculo,
            lat,
            lng,
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

    useEffect(() => {
      if (state.vehicles.length === 0) return;

      const timer = setInterval(() => {
        if (Math.random() > 0.9) {
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
          toast({
            title: "Nueva Incidencia",
            description: `Boton de Panico: ${incident.placa}`,
            variant: 'destructive',
          });
        }
      }, 30000); 

      return () => clearInterval(timer);
    }, [state.vehicles]);


    useEffect(() => {
        const { historyVehicle } = state;
        if (!historyVehicle || !state.isLoadingRoute) return;

        const fetchRoute = async () => {
            try {
                const response = await fetch('/api/routes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vehicleId: historyVehicle.id_vehiculo,
                    }),
                });
                if (!response.ok) throw new Error('Failed to fetch route');
                const data = await response.json();
                
                if (typeof document !== 'undefined' && (document as any).startViewTransition) {
                    (document as any).startViewTransition(() => {
                        dispatch({ type: 'SET_ROUTE_HISTORY', payload: data });
                    });
                } else {
                    dispatch({ type: 'SET_ROUTE_HISTORY', payload: data });
                }
            } catch (error) {
                console.error("Error fetching route", error);
                dispatch({ type: 'BACK_TO_FLEET' });
            }
        };

        fetchRoute();
    }, [state.historyVehicle?.id_vehiculo, state.isLoadingRoute]);

    useEffect(() => {
      const { historyVehicle } = state;
      if (!historyVehicle || !state.isLoadingIncidencias) return;

      const fetchIncidencias = async () => {
          try {
              const response = await fetch('/api/incidencias', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      vehicleId: historyVehicle.id_vehiculo,
                  }),
              });
              if (!response.ok) throw new Error('Failed to fetch incidencias');
              const data = await response.json();
              
              if (typeof document !== 'undefined' && (document as any).startViewTransition) {
                  (document as any).startViewTransition(() => {
                      dispatch({ type: 'SET_INCIDENCIAS', payload: data });
                  });
              } else {
                  dispatch({ type: 'SET_INCIDENCIAS', payload: data });
              }
          } catch (error) {
              console.error("Error fetching incidencias", error);
              dispatch({ type: 'BACK_TO_FLEET' });
          }
      };

      fetchIncidencias();
  }, [state.historyVehicle?.id_vehiculo, state.isLoadingIncidencias]);

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
    if (context === undefined) {
        throw new Error('useFleetState must be used within a FleetProvider');
    }
    return context;
};

export const useFleetDispatch = () => {
    const context = useContext(FleetDispatchContext);
    if (context === undefined) {
        throw new Error('useFleetDispatch must be used within a FleetProvider');
    }
    return context;
};
