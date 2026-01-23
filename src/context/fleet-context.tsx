

'use client';

import { createContext, useContext, useReducer, useEffect, type Dispatch, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Vehicle, VehicleStatus, RouteSegment, VehicleHistoryPoint, MapViewport } from '@/lib/types';
import { AlertCircle, Car, Clock, Power, PowerOff, Battery, BatteryWarning, DoorOpen, Siren, PowerCircle, WifiOff, Wrench, Ban, Key, Truck, ParkingSquare } from 'lucide-react';


const fetchVehicles = async (): Promise<Vehicle[]> => {
  const res = await fetch('/api/vehicles');
  if (!res.ok) {
    throw new Error('Failed to fetch vehicles');
  }
  const data = await res.json();
  return data;
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
  statusFilter: VehicleStatus | 'all';
  selectedVehicle: Vehicle | null;
  historyVehicle: Vehicle | null;
  routePath: { lat: number; lng: number }[][] | null;
  routeSegments: RouteSegment[];
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
  | { type: 'SET_STATUS_FILTER'; payload: VehicleStatus | 'all' }
  | { type: 'PAN_TO_VEHICLE'; payload: Vehicle | null }
  | { type: 'START_ROUTE_LOADING'; payload: Vehicle }
  | { type: 'SET_ROUTE_HISTORY'; payload: { routePoints: { lat: number; lng: number }[][]; segments: RouteSegment[] } }
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
  statusFilter: 'all',
  selectedVehicle: null,
  historyVehicle: null,
  routePath: null,
  routeSegments: [],
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


export const statusDetailsMap: { [key in VehicleStatus]: { name: string; color: string; icon: React.ElementType; } } = {
    '0': { name: 'Libre', color: '#B0BEC5', icon: Key },
    '1': { name: 'SRalenti', color: '#78909C', icon: Clock },
    '2': { name: 'Vehiculo Detenido y Encendido', color: '#F1C40F', icon: Power },
    '3': { name: 'Exceso de Velocidad', color: '#E74C3C', icon: Siren },
    '4': { name: 'Ralenti', color: '#9E9E9E', icon: PowerOff },
    '5': { name: 'Estacionado', color: '#666666', icon: Ban },
    '6': { name: 'Transitando', color: '#00CC33', icon: Truck },
    '7': { name: 'Bloqueado', color: '#003399', icon: Ban },
    '8': { name: 'Desconeccion de Bateria', color: '#FF66B0', icon: BatteryWarning },
    '9': { name: 'Mantenimiento', color: '#8D6E63', icon: Wrench },
    '10': { name: 'Motor Encendido via Remoto', color: '#27AE60', icon: PowerCircle },
};

export const routeStatusDetailsMap: { [key: string]: { name: string; color: string; icon: React.ElementType; } } = {
  '4': { name: 'Ralenti', color: '#9E9E9E', icon: Clock },
  '5': { name: 'Estacionado', color: '#666666', icon: ParkingSquare },
  '6': { name: 'Transitando', color: '#00CC33', icon: Truck },
};


export const ALL_STATUSES = Object.keys(statusDetailsMap) as VehicleStatus[];


// 4. Create the reducer function
const fleetReducer = (state: FleetState, action: FleetAction): FleetState => {
  switch (action.type) {
    case 'SET_VEHICLES': {
      const newVisibleIds = state.vehicles.length === 0 
        ? new Set(action.payload.map(v => v.id))
        : state.visibleVehicleIds;
    
      const visibleVehicles = action.payload.filter(v => newVisibleIds.has(v.id));

      const newBounds = visibleVehicles.length > 0
          ? visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng }))
          : [];

      const updatedSelectedVehicle = state.selectedVehicle
        ? action.payload.find(v => v.id === state.selectedVehicle!.id) || null
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
        mapViewport: { type: 'pan_to_vehicle', payload: action.payload }
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
        const { routePoints, segments } = action.payload;
        const startOfRoute = routePoints && routePoints.length > 0 && routePoints[0].length > 0 ? routePoints[0][0] : null;

        const updatedHistoryVehicle = state.historyVehicle && startOfRoute
            ? { ...state.historyVehicle, lat: startOfRoute.lat, lng: startOfRoute.lng }
            : state.historyVehicle;
        
        return {
            ...state,
            isLoadingRoute: false,
            routePath: routePoints,
            routeSegments: segments,
            isRouteSheetOpen: true,
            historyVehicle: updatedHistoryVehicle,
            isRoutePlaying: false,
            mapViewport: { type: 'fit_route', payload: routePoints.flat() },
        };
    }

    case 'BACK_TO_FLEET': {
        const visibleVehicles = state.vehicles.filter(v => state.visibleVehicleIds.has(v.id));
        const newBounds = visibleVehicles.length > 0
            ? visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng }))
            : [];
        
        return {
            ...state,
            historyVehicle: null,
            routePath: null,
            routeSegments: [],
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
      const { selectedSegmentIndex, routeSegments, historyVehicle, routePath } = state;

      if (!historyVehicle) {
        return state;
      }
      
      if (selectedSegmentIndex === segmentIndex) {
        const startSegment = routeSegments[0];
        
        if (!startSegment) {
             return { ...state, selectedSegmentIndex: null };
        }
        
        const resetVehicle = {
          ...historyVehicle,
          lat: startSegment.startPoint.lat,
          lng: startSegment.startPoint.lng,
          status: startSegment.id_estado as VehicleStatus,
          velocidad: 0,
          rumbo: startSegment.records[0]?.rumbo || 0,
        };

        return {
          ...state,
          selectedSegmentIndex: null,
          historyVehicle: resetVehicle,
          mapViewport: { type: 'fit_route', payload: routePath?.flat() || [] },
        };
      }

      const segmentToSelect = routeSegments[segmentIndex];

      if (!segmentToSelect) {
          return state;
      }

      const updatedVehicle = {
        ...historyVehicle,
        lat: segmentToSelect.startPoint.lat,
        lng: segmentToSelect.startPoint.lng,
        status: segmentToSelect.id_estado as VehicleStatus,
        velocidad: Math.round(segmentToSelect.avgSpeed),
        rumbo: segmentToSelect.records[0]?.rumbo || historyVehicle.rumbo,
      };

      let newMapViewport: MapViewport;

      if (segmentToSelect.id_estado === '6') {
        const segmentPoints = segmentToSelect.records.map(r => {
          const [lat, lng] = r.coordenadas.split(',').map(Number);
          return { lat, lng };
        });
        newMapViewport = segmentPoints.length > 0 ? { type: 'fit_bounds', payload: segmentPoints } : state.mapViewport;
      } else {
        newMapViewport = { type: 'pan_to_vehicle', payload: { ...updatedVehicle }};
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
          v.id === vehicleId
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
            historyVehicle: state.historyVehicle ? { ...state.historyVehicle, status: '6' as VehicleStatus } : state.historyVehicle,
        };

    case 'PAUSE_ROUTE_PLAYBACK':
        return {
            ...state,
            isRoutePlaying: false,
        };

    case 'UPDATE_HISTORY_VEHICLE_POSITION': {
        if (!state.historyVehicle) return state;
        const { lat, lng, rumbo, velocidad, animationDuration } = action.payload;
        const movingStatus = '6' as VehicleStatus;
        return {
            ...state,
            historyVehicle: {
                ...state.historyVehicle,
                lat,
                lng,
                rumbo,
                velocidad,
                status: movingStatus,
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
  return state.vehicles.filter(v => state.visibleVehicleIds.has(v.id));
};

export const selectFilteredVehicles = (state: FleetState): Vehicle[] => {
  const visibleVehicles = selectVisibleVehicles(state);
  if (state.statusFilter === 'all') {
    return visibleVehicles;
  }
  return visibleVehicles.filter(v => v.status === state.statusFilter);
};

export const selectMapVehicles = (state: FleetState): Vehicle[] => {
  if (state.historyVehicle) {
    return [state.historyVehicle];
  }
  return selectFilteredVehicles(state);
};

export const selectRouteSummary = (state: FleetState) => {
  const { routeSegments } = state;
  if (!routeSegments || routeSegments.length === 0) {
    return { totalDistance: 0, totalDuration: 0, totalStops: 0, totalStopTime: 0 };
  }

  return routeSegments.reduce(
    (summary, segment) => {
      summary.totalDistance += segment.distanceKm;
      summary.totalDuration += segment.durationMinutes;
      if (segment.id_estado === '5') {
        summary.totalStops += 1;
        summary.totalStopTime += segment.durationMinutes;
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
      data: vehiclesData,
      isLoading: isLoadingVehicles,
      error,
    } = useQuery<Vehicle[], Error>({
      queryKey: ['vehicles'],
      queryFn: fetchVehicles,
      refetchInterval: false,
    });
    
    useEffect(() => {
        if (vehiclesData) {
          dispatch({ type: 'SET_VEHICLES', payload: vehiclesData });
        }
    }, [vehiclesData]);


    useEffect(() => {
        const { historyVehicle } = state;
        if (!historyVehicle || !state.isLoadingRoute) return;

        const fetchRoute = async () => {
            try {
                const response = await fetch('/api/routes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vehicleId: historyVehicle.id,
                    }),
                });
                if (!response.ok) throw new Error('Failed to fetch route');
                const data = await response.json();
                
                if (document.startViewTransition) {
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
    }, [state.historyVehicle?.id, state.isLoadingRoute]);

    const stateContextValue = useMemo(() => ({
        state,
        isLoadingVehicles,
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
