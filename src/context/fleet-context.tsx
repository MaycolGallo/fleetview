
'use client';

import { createContext, useContext, useReducer, useEffect, type Dispatch, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Vehicle, RawVehicle, VehicleStatus, VehiculoHistorialGrouped, VHistorial, MapViewport } from '@/lib/types';
import { Key, Clock, Power, Siren, PowerOff, Ban, Truck, BatteryWarning, Wrench, PowerCircle, ParkingSquare } from 'lucide-react';

const fetchVehicles = async (): Promise<RawVehicle[]> => {
  const res = await fetch('/api/vehicles');
  if (!res.ok) {
    throw new Error('Failed to fetch vehicles');
  }
  return res.json();
};

// A small, circular route in Lima for simulation purposes.
const SIMULATION_ROUTE = [
  { lat: -12.045, lng: -77.040 },
  { lat: -12.048, lng: -77.042 },
  { lat: -12.050, lng: -77.038 },
  { lat: -12.047, lng: -77.036 },
];


// 1. Define the state shape
interface FleetState {
  vehicles: Vehicle[];
  statusFilter: VehicleStatus[];
  selectedVehicle: Vehicle | null;
  historyVehicle: Vehicle | null;
  routePath: { lat: number; lng: number }[][] | null;
  routeGroups: VehiculoHistorialGrouped[];
  isRouteSheetOpen: boolean;
  isLoadingRoute: boolean;
  selectedSegmentIndex: number | null;
  visibleVehicleIds: Set<number>;
  isMapDark: boolean;
  mapViewport: MapViewport;
  simulationStep: Record<string, number>;
  pinRotationMode: 'arrow' | 'pin';
  isRoutePlaying: boolean;
  playbackAnimationDuration: number;
}

// 2. Define the actions
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
  | { type: 'SET_ALL_VEHICLES_VISIBILITY', payload: { ids: number[], visible: boolean } }
  | { type: 'SET_MAP_DARK_MODE', payload: boolean }
  | { type: 'SET_PIN_ROTATION_MODE', payload: 'arrow' | 'pin' }
  | { type: 'SIMULATE_VEHICLE_MOVE', payload: number }
  | { type: 'VIEWPORT_ACTION_COMPLETE' }
  | { type: 'START_ROUTE_PLAYBACK' }
  | { type: 'PAUSE_ROUTE_PLAYBACK' }
  | { type: 'UPDATE_HISTORY_VEHICLE_POSITION', payload: { lat: number, lng: number, rumbo: number, velocidad: number, animationDuration: number } };


// 3. Define the initial state
const getInitialState = (): FleetState => ({
  vehicles: [],
  statusFilter: [],
  selectedVehicle: null,
  historyVehicle: null,
  routePath: null,
  routeGroups: [],
  isRouteSheetOpen: false,
  isLoadingRoute: false,
  selectedSegmentIndex: null,
  visibleVehicleIds: new Set(),
  isMapDark: false,
  mapViewport: { type: 'initial' },
  simulationStep: {},
  pinRotationMode: 'arrow',
  isRoutePlaying: false,
  playbackAnimationDuration: 1000,
});


// 4. Create the reducer function
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
      };

    case 'SET_ROUTE_HISTORY': {
        const historyData = action.payload;
        const routePoints = historyData.groups
          .filter(g => g.id_estado === 6) // Transitando
          .map(g => g.records.map(r => ({ lat: r.lat, lng: r.lng })));

        const startOfRoute = historyData.groups?.[0]?.records?.[0];

        const updatedHistoryVehicle = state.historyVehicle && startOfRoute
            ? { ...state.historyVehicle, lat: startOfRoute.lat, lng: startOfRoute.lng, rumbo: startOfRoute?.rumbo || 0, velocidad: "0" }
            : state.historyVehicle;
        
        return {
            ...state,
            isLoadingRoute: false,
            routePath: routePoints,
            routeGroups: historyData.groups,
            isRouteSheetOpen: true,
            historyVehicle: updatedHistoryVehicle,
            isRoutePlaying: false,
            mapViewport: { type: 'fit_route', payload: routePoints.flat() },
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
            selectedVehicle: null,
            isRouteSheetOpen: false,
            selectedSegmentIndex: null,
            isLoadingRoute: false,
            isRoutePlaying: false,
            mapViewport: { type: 'fit_bounds', payload: newBounds },
        };
    }

    case 'SELECT_ROUTE_SEGMENT': {
      const segmentIndex = action.payload;
      const { selectedSegmentIndex, routeGroups, historyVehicle } = state;
      
      if (!historyVehicle) return state;

      // Handle deselecting the current segment
      if (selectedSegmentIndex === segmentIndex) {
        const startSegment = routeGroups[0];
        if (!startSegment?.records?.[0]) return state;

        const firstRecord = startSegment.records[0];
        const resetVehicle = {
          ...historyVehicle,
          lat: firstRecord.lat,
          lng: firstRecord.lng,
          id_estado: startSegment.id_estado,
          velocidad: '0',
          rumbo: firstRecord.rumbo || 0,
        };

        return {
          ...state,
          selectedSegmentIndex: null,
          historyVehicle: resetVehicle,
          mapViewport: { type: 'fit_route', payload: state.routePath?.flat() || [] },
        };
      }

      const segmentToSelect = routeGroups[segmentIndex];
      if (!segmentToSelect?.records?.[0]) return state;
      
      const firstRecord = segmentToSelect.records[0];
      const updatedVehicle = {
        ...historyVehicle,
        lat: firstRecord.lat,
        lng: firstRecord.lng,
        id_estado: segmentToSelect.id_estado,
        velocidad: String(Math.round(segmentToSelect.avg_velocidad)),
        rumbo: firstRecord.rumbo || historyVehicle.rumbo,
        statusName: segmentToSelect.description,
        statusColor: segmentToSelect.color || historyVehicle.statusColor,
      };

      let newMapViewport: MapViewport;
      if (segmentToSelect.id_estado === 6) { // Transitando
        const segmentPoints = segmentToSelect.records.map(r => ({ lat: r.lat, lng: r.lng }));
        newMapViewport = segmentPoints.length > 0 ? { type: 'fit_bounds', payload: segmentPoints } : state.mapViewport;
      } else {
        newMapViewport = { type: 'pan_to_vehicle', payload: { lat: firstRecord.lat, lng: firstRecord.lng }};
      }

      return {
        ...state,
        selectedSegmentIndex: segmentIndex,
        historyVehicle: updatedVehicle,
        mapViewport: newMapViewport,
      };
    }

    case 'TOGGLE_VEHICLE_VISIBILITY': {
        const newVisibleIds = new Set(state.visibleVehicleIds);
        if (newVisibleIds.has(action.payload)) {
            newVisibleIds.delete(action.payload);
        } else {
            newVisibleIds.add(action.payload);
        }
        return { ...state, visibleVehicleIds: newVisibleIds };
    }

    case 'SET_ALL_VEHICLES_VISIBILITY': {
        const newVisibleIds = new Set(state.visibleVehicleIds);
        if (action.payload.visible) {
            action.payload.ids.forEach(id => newVisibleIds.add(id));
        } else {
            action.payload.ids.forEach(id => newVisibleIds.delete(id));
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

    default:
      return state;
  }
};

// Selectors
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

export const selectMapVehicles = (state: FleetState): Vehicle[] => {
  if (state.historyVehicle) {
    return [state.historyVehicle];
  }
  return selectFilteredVehicles(state);
};

export const selectRouteSummary = (state: FleetState) => {
  const { routeGroups } = state;
  if (!routeGroups || routeGroups.length === 0) {
    return { totalDistance: 0, totalDuration: 0, totalStops: 0, totalStopTime: 0 };
  }

  return routeGroups.reduce(
    (summary, group) => {
      summary.totalDistance += group.total_distance_km;
      summary.totalDuration += group.total_time_seconds / 60; // duration in minutes
      if (group.id_estado === 5) { // Estacionado
        summary.totalStops += 1;
        summary.totalStopTime += group.total_time_seconds / 60;
      }
      return summary;
    },
    { totalDistance: 0, totalDuration: 0, totalStops: 0, totalStopTime: 0 }
  );
};


// 5. Create the context
interface FleetStateContextValue {
    state: FleetState;
    isLoadingVehicles: boolean;
    error: Error | null;
}

const FleetStateContext = createContext<FleetStateContextValue | undefined>(undefined);
const FleetDispatchContext = createContext<Dispatch<FleetAction> | undefined>(undefined);


// 6. Create the Provider component
export const FleetProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(fleetReducer, getInitialState());

    const {
      data: rawVehiclesData,
      isLoading: isLoadingVehicles,
      error,
    } = useQuery<RawVehicle[], Error>({
      queryKey: ['vehicles'],
      queryFn: fetchVehicles,
      refetchInterval: 5000, // Refetch every 5 seconds
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
                
                if (document.startViewTransition) {
                    // @ts-ignore
                    document.startViewTransition(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.historyVehicle?.id_vehiculo, state.isLoadingRoute]);

    const stateContextValue = useMemo(() => ({
        state,
        isLoadingVehicles: isLoadingVehicles && state.vehicles.length === 0, // Only show initial loading
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

// 7. Create custom hooks to use the contexts
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
