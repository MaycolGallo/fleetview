

'use client';

import { createContext, useContext, useReducer, useEffect, type Dispatch } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Vehicle, VehicleStatus, RouteEvent } from '@/lib/types';
import { AlertCircle, Car, Clock, Power, PowerOff, Battery, BatteryWarning, DoorOpen, Siren, PowerCircle, WifiOff, Wrench, Ban, Key, Truck } from 'lucide-react';


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
type MapViewport = 
  | { type: 'initial' }
  | { type: 'pan_to_vehicle', payload: Vehicle }
  | { type: 'fit_bounds', payload: { lat: number, lng: number }[] }
  | { type: 'fit_route', payload: { lat: number, lng: number }[] };


interface FleetState {
  vehicles: Vehicle[];
  statusFilter: VehicleStatus | 'all';
  selectedVehicle: Vehicle | null;
  routeHistoryVehicle: Vehicle | null;
  routePath: { lat: number; lng: number }[] | null;
  routeEvents: RouteEvent[];
  isRouteSheetOpen: boolean;
  isLoadingRoute: boolean;
  selectedSegmentIndex: number | null;
  highlightedSegment: { lat: number; lng: number }[] | null;
  visibleVehicleIds: Set<number>;
  isMapDark: boolean;
  mapViewport: MapViewport;
  simulationStep: Record<string, number>;
  pinRotationMode: 'arrow' | 'pin';
}

// 2. Define the actions
type FleetAction =
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'SET_STATUS_FILTER'; payload: VehicleStatus | 'all' }
  | { type: 'PAN_TO_VEHICLE'; payload: Vehicle | null }
  | { type: 'START_ROUTE_LOADING'; payload: Vehicle }
  | { type: 'SET_ROUTE_HISTORY'; payload: { routePoints: { lat: number; lng: number }[]; routeEvents: RouteEvent[] } }
  | { type: 'BACK_TO_FLEET' }
  | { type: 'SELECT_ROUTE_SEGMENT'; payload: number }
  | { type: 'SELECT_MAP_SEGMENT'; payload: number }
  | { type: 'SET_ROUTE_SHEET_OPEN', payload: boolean }
  | { type: 'TOGGLE_VEHICLE_VISIBILITY', payload: number }
  | { type: 'SET_ALL_VEHICLES_VISIBILITY', payload: { ids: number[], visible: boolean } }
  | { type: 'SET_MAP_DARK_MODE', payload: boolean }
  | { type: 'SET_PIN_ROTATION_MODE', payload: 'arrow' | 'pin' }
  | { type: 'SIMULATE_VEHICLE_MOVE', payload: number };


// 3. Define the initial state
const getInitialState = (): FleetState => ({
  vehicles: [],
  statusFilter: 'all',
  selectedVehicle: null,
  routeHistoryVehicle: null,
  routePath: null,
  routeEvents: [],
  isRouteSheetOpen: false,
  isLoadingRoute: false,
  selectedSegmentIndex: null,
  highlightedSegment: null,
  visibleVehicleIds: new Set(),
  isMapDark: false,
  mapViewport: { type: 'initial' },
  simulationStep: {},
  pinRotationMode: 'arrow',
});

// Helper function to calculate segment points
const getSegmentPoints = (state: FleetState, segmentIndex: number) => {
    if (!state.routePath || !state.routeEvents || state.routePath.length === 0) return { segmentPoints: [], highlightedSegment: null };

    let eventStartIndex = 0;
    for(let i=0; i<segmentIndex; i++) {
        if(state.routeEvents[i]?.status !== 'start' && state.routeEvents[i]?.status !== 'end') {
            eventStartIndex++;
        }
    }

    const pointsPerEvent = state.routeEvents.filter(e => e.status !== 'start' && e.status !== 'end').length > 1 ? Math.floor((state.routePath.length -1) / (state.routeEvents.filter(e => e.status !== 'start' && e.status !== 'end').length -1)) : state.routePath.length;
    
    const startPointIndex = eventStartIndex * pointsPerEvent;
    const endPointIndex = (segmentIndex === state.routeEvents.length - 2)
      ? state.routePath.length - 1
      : (eventStartIndex + 1) * pointsPerEvent;

    let segmentPoints: { lat: number; lng: number }[] = [];
    if (startPointIndex >= endPointIndex) {
      if (state.routePath[startPointIndex]) {
        segmentPoints = [state.routePath[startPointIndex]];
      }
    } else {
      segmentPoints = state.routePath.slice(startPointIndex, endPointIndex + 1);
    }
    
    return { 
        segmentPoints: segmentPoints.length > 0 ? segmentPoints : [], 
        highlightedSegment: segmentPoints.length > 1 ? segmentPoints : null 
    };
}

export const statusDetailsMap: { [key in VehicleStatus]: { name: string; color: string; icon: React.ElementType; } } = {
    '0': { name: 'Libre', color: '#B0BEC5', icon: Key }, // Assuming 'Libre' is 'Free'
    '1': { name: 'SRalenti', color: '#78909C', icon: Clock }, // Slow Idle
    '2': { name: 'Vehiculo Detenido y Encendido', color: '#F1C40F', icon: Power }, // Kept from old map
    '3': { name: 'Exceso de Velocidad', color: '#E74C3C', icon: Siren },
    '4': { name: 'Ralenti', color: '#9E9E9E', icon: PowerOff }, // Idle
    '5': { name: 'Estacionado', color: '#666666', icon: Ban }, // Parked
    '6': { name: 'Transitando', color: '#00CC33', icon: Truck }, // In Transit
    '7': { name: 'Bloqueado', color: '#003399', icon: Ban }, // Blocked
    '8': { name: 'Desconeccion de Bateria', color: '#FF66B0', icon: BatteryWarning }, // Battery disconnected
    '9': { name: 'Mantenimiento', color: '#8D6E63', icon: Wrench }, // Maintenance
    '10': { name: 'Motor Encendido via Remoto', color: '#27AE60', icon: PowerCircle },
};

export const ALL_STATUSES = Object.keys(statusDetailsMap) as VehicleStatus[];


// 4. Create the reducer function
const fleetReducer = (state: FleetState, action: FleetAction): FleetState => {
  switch (action.type) {
    case 'SET_VEHICLES': {
      // If this is the first time we're setting vehicles, make them all visible by default
      const newVisibleIds = state.vehicles.length === 0 
        ? new Set(action.payload.map(v => v.id))
        : state.visibleVehicleIds;
    
      const visibleVehicles = action.payload.filter(v => newVisibleIds.has(v.id));

      const newBounds = visibleVehicles.length > 0
          ? visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng }))
          : [];

      // Update the selected vehicle instance if it exists
      const updatedSelectedVehicle = state.selectedVehicle
        ? action.payload.find(v => v.id === state.selectedVehicle!.id) || null
        : null;

       return {
         ...state,
         vehicles: action.payload,
         selectedVehicle: updatedSelectedVehicle,
         visibleVehicleIds: newVisibleIds,
         // Only change viewport on initial load
         mapViewport: state.mapViewport.type === 'initial' && newBounds.length > 0 
          ? { type: 'fit_bounds', payload: newBounds } 
          : state.mapViewport,
       };
    }
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload };
    
    case 'PAN_TO_VEHICLE': {
      if (action.payload === null) {
         // This is a deselection event
         const visibleVehicles = state.vehicles.filter(v => state.visibleVehicleIds.has(v.id));
          const newBounds = visibleVehicles.length > 0
            ? visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng }))
            : [];
        return { 
            ...state, 
            selectedVehicle: null,
            mapViewport: { type: 'fit_bounds', payload: newBounds }
        };
      }
      // This is a selection event
      return { 
        ...state, 
        selectedVehicle: action.payload,
        mapViewport: { type: 'pan_to_vehicle', payload: action.payload }
      };
    }

    case 'SET_ROUTE_SHEET_OPEN':
      // If we're closing the sheet, also go back to the main fleet view.
      if (action.payload === false && state.isRouteSheetOpen === true) {
        const visibleVehicles = state.vehicles.filter(v => state.visibleVehicleIds.has(v.id));
        const newBounds = visibleVehicles.length > 0
            ? visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng }))
            : [];
        return {
          ...state,
          routeHistoryVehicle: null,
          routePath: null,
          routeEvents: [],
          selectedVehicle: null,
          isRouteSheetOpen: false,
          highlightedSegment: null,
          selectedSegmentIndex: null,
          isLoadingRoute: false,
          mapViewport: { type: 'fit_bounds', payload: newBounds },
        }
      }
      return { ...state, isRouteSheetOpen: action.payload };

    case 'START_ROUTE_LOADING':
      return {
        ...state,
        selectedVehicle: null, // Clear selection when starting to load route
        isLoadingRoute: true,
        routeHistoryVehicle: action.payload,
      };

    case 'SET_ROUTE_HISTORY':
      return {
        ...state,
        isLoadingRoute: false,
        routePath: action.payload.routePoints,
        routeEvents: action.payload.routeEvents,
        isRouteSheetOpen: true,
        mapViewport: { type: 'fit_route', payload: action.payload.routePoints },
      };

    case 'BACK_TO_FLEET': {
        const visibleVehicles = state.vehicles.filter(v => state.visibleVehicleIds.has(v.id));
        const newBounds = visibleVehicles.length > 0
            ? visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng }))
            : [];
        return {
            ...state,
            routeHistoryVehicle: null,
            routePath: null,
            routeEvents: [],
            selectedVehicle: null,
            isRouteSheetOpen: false,
            highlightedSegment: null,
            selectedSegmentIndex: null,
            isLoadingRoute: false,
            mapViewport: { type: 'fit_bounds', payload: newBounds },
        };
    }

    case 'SELECT_ROUTE_SEGMENT': {
      const segmentIndex = action.payload;
      if (state.selectedSegmentIndex === segmentIndex) {
        // Deselect if clicking the same segment
        return {
          ...state,
          selectedSegmentIndex: null,
          highlightedSegment: null,
          mapViewport: { type: 'fit_route', payload: state.routePath || [] },
        };
      }
      const { segmentPoints, highlightedSegment } = getSegmentPoints(state, segmentIndex);
      return {
        ...state,
        selectedSegmentIndex: segmentIndex,
        highlightedSegment: highlightedSegment,
        mapViewport: segmentPoints ? { type: 'fit_bounds', payload: segmentPoints } : state.mapViewport,
      };
    }
    
    case 'SELECT_MAP_SEGMENT': {
        const pointIndex = action.payload;
        if (!state.routePath || !state.routeEvents || state.routeEvents.length <= 1) return state;

        const events = state.routeEvents.filter(e => e.status !== 'start' && e.status !== 'end');
        const pointsPerEvent = events.length > 1 ? (state.routePath.length -1) / (events.length -1) : state.routePath.length;

        const segmentIndex = Math.min(events.length - 1, Math.floor(pointIndex / pointsPerEvent));
        
        // Find the corresponding index in the original routeEvents array
        let originalIndex = -1;
        let eventCounter = -1;
        for (let i = 0; i < state.routeEvents.length; i++) {
            const event = state.routeEvents[i];
            if (event.status !== 'start' && event.status !== 'end') {
                eventCounter++;
                if (eventCounter === segmentIndex) {
                    originalIndex = i;
                    break;
                }
            }
        }

        if (originalIndex === -1 || state.selectedSegmentIndex === originalIndex) return state;
       
        const { segmentPoints, highlightedSegment } = getSegmentPoints(state, originalIndex);
        return {
            ...state,
            selectedSegmentIndex: originalIndex,
            highlightedSegment: highlightedSegment,
             mapViewport: segmentPoints ? { type: 'fit_bounds', payload: segmentPoints } : state.mapViewport,
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
  if (state.routeHistoryVehicle) {
    return [state.routeHistoryVehicle];
  }
  return selectFilteredVehicles(state);
};

export const selectRouteSummary = (state: FleetState) => {
  const { routeEvents } = state;
  if (!routeEvents || routeEvents.length === 0) {
    return { totalDistance: 0, totalDuration: 0, totalStops: 0, totalStopTime: 0 };
  }

  return routeEvents.reduce(
    (summary, event) => {
      summary.totalDistance += event.distanceKm;
      summary.totalDuration += event.durationMinutes;
      if (event.status === 'stop') {
        summary.totalStops += 1;
        summary.totalStopTime += event.durationMinutes;
      }
      return summary;
    },
    { totalDistance: 0, totalDuration: 0, totalStops: 0, totalStopTime: 0 }
  );
};


// 5. Create the context
interface FleetContextValue {
    state: FleetState;
    dispatch: Dispatch<FleetAction>;
    isLoadingVehicles: boolean;
    error: Error | null;
}

const FleetContext = createContext<FleetContextValue | undefined>(undefined);

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
      refetchInterval: false, // Turned off for dev
    });
    
    useEffect(() => {
        if (vehiclesData) {
          dispatch({ type: 'SET_VEHICLES', payload: vehiclesData });
        }
    }, [vehiclesData]);


    useEffect(() => {
        const { routeHistoryVehicle } = state;
        if (!routeHistoryVehicle) return;

        const fetchRoute = async () => {
            try {
                const response = await fetch('/api/routes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vehicleId: routeHistoryVehicle.id, // Pass vehicle ID
                    }),
                });
                if (!response.ok) throw new Error('Failed to fetch route');
                const data = await response.json();
                dispatch({ type: 'SET_ROUTE_HISTORY', payload: data });
            } catch (error) {
                console.error("Error fetching route", error);
                dispatch({ type: 'BACK_TO_FLEET' }); // Go back if route fails
            }
        };

        fetchRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.routeHistoryVehicle]);


    return (
        <FleetContext.Provider value={{ state, dispatch, isLoadingVehicles, error }}>
            {children}
        </FleetContext.Provider>
    );
};

// 7. Create a custom hook to use the context
export const useFleet = () => {
    const context = useContext(FleetContext);
    if (context === undefined) {
        throw new Error('useFleet must be used within a FleetProvider');
    }
    return context;
};
