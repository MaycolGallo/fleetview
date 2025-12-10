
'use client';

import { createContext, useContext, useReducer, useEffect, type Dispatch } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Vehicle, VehicleStatus, RouteEvent } from '@/lib/types';

// 1. Define the state shape
interface FleetState {
  vehicles: Vehicle[];
  statusFilter: VehicleStatus | 'all';
  selectedVehicle: Vehicle | null;
  routeHistoryVehicle: Vehicle | null;
  routePath: { lat: number; lng: number }[] | null;
  routeEvents: RouteEvent[];
  isRouteSheetOpen: boolean;
  isLoadingRoute: boolean;
  routeSegmentToFit: { lat: number; lng: number }[] | null;
  selectedSegmentIndex: number | null;
  highlightedSegment: { lat: number; lng: number }[] | null;
  visibleVehicleIds: Set<string>;
  isMapDark: boolean;
}

// 2. Define the actions
type FleetAction =
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'SET_STATUS_FILTER'; payload: VehicleStatus | 'all' }
  | { type: 'SELECT_VEHICLE'; payload: Vehicle | null }
  | { type: 'PAN_TO_VEHICLE'; payload: Vehicle | null }
  | { type: 'START_ROUTE_LOADING'; payload: Vehicle }
  | { type: 'SET_ROUTE_HISTORY'; payload: { routePoints: { lat: number; lng: number }[]; routeEvents: RouteEvent[] } }
  | { type: 'BACK_TO_FLEET' }
  | { type: 'SELECT_ROUTE_SEGMENT'; payload: number }
  | { type: 'SELECT_MAP_SEGMENT'; payload: number }
  | { type: 'SET_ROUTE_SHEET_OPEN', payload: boolean }
  | { type: 'TOGGLE_VEHICLE_VISIBILITY', payload: string }
  | { type: 'SET_ALL_VEHICLES_VISIBILITY', payload: { ids: string[], visible: boolean } }
  | { type: 'SET_MAP_DARK_MODE', payload: boolean };


// 3. Define the initial state
const getInitialState = (initialVehicles: Vehicle[] = []): FleetState => ({
  vehicles: initialVehicles,
  statusFilter: 'all',
  selectedVehicle: null,
  routeHistoryVehicle: null,
  routePath: null,
  routeEvents: [],
  isRouteSheetOpen: false,
  isLoadingRoute: false,
  routeSegmentToFit: null,
  selectedSegmentIndex: null,
  highlightedSegment: null,
  visibleVehicleIds: new Set(initialVehicles.map(v => v.vehicleId)),
  isMapDark: true,
});

// Helper function to calculate segment points
const getSegmentPoints = (state: FleetState, segmentIndex: number) => {
    if (!state.routePath || !state.routeEvents || state.routePath.length === 0) return { segmentPoints: [], highlightedSegment: null };

    const pointsPerEvent = state.routeEvents.length > 1 ? Math.floor((state.routePath.length - 1) / (state.routeEvents.length - 1)) : state.routePath.length;
    const startPointIndex = segmentIndex * pointsPerEvent;
    const endPointIndex = (segmentIndex === state.routeEvents.length - 1) 
      ? state.routePath.length - 1
      : (segmentIndex + 1) * pointsPerEvent;

    let segmentPoints: { lat: number; lng: number }[] = [];
    if (startPointIndex >= endPointIndex) {
      if (state.routePath[startPointIndex]) {
        segmentPoints = [state.routePath[startPointIndex]];
      }
    } else {
      segmentPoints = state.routePath.slice(startPointIndex, endPointIndex + 1);
    }
    
    return { 
        segmentPoints: segmentPoints.length > 0 ? segmentPoints : null, 
        highlightedSegment: segmentPoints.length > 1 ? segmentPoints : null 
    };
}


// 4. Create the reducer function
const fleetReducer = (state: FleetState, action: FleetAction): FleetState => {
  switch (action.type) {
    case 'SET_VEHICLES':
      return { 
        ...state, 
        vehicles: action.payload,
        visibleVehicleIds: new Set(action.payload.map(v => v.vehicleId)),
      };

    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload };

    case 'SELECT_VEHICLE':
        return { 
          ...state, 
          selectedVehicle: action.payload,
        };
    
    case 'PAN_TO_VEHICLE':
      if (action.payload === null) {
        return { ...state, selectedVehicle: null };
      }
      return { ...state, selectedVehicle: action.payload, routeSegmentToFit: [{ lat: action.payload.latitude, lng: action.payload.longitude }] };

    case 'SET_ROUTE_SHEET_OPEN':
      // If we're closing the sheet, also go back to the main fleet view.
      if (action.payload === false && state.isRouteSheetOpen === true) {
        return {
          ...state,
          routeHistoryVehicle: null,
          routePath: null,
          routeEvents: [],
          selectedVehicle: null,
          isRouteSheetOpen: false,
          routeSegmentToFit: null,
          highlightedSegment: null,
          selectedSegmentIndex: null,
          isLoadingRoute: false,
        }
      }
      return { ...state, isRouteSheetOpen: action.payload };

    case 'START_ROUTE_LOADING':
      return {
        ...state,
        selectedVehicle: null,
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
        routeSegmentToFit: action.payload.routePoints.length > 0 ? action.payload.routePoints : null,
      };

    case 'BACK_TO_FLEET':
      return {
        ...state,
        routeHistoryVehicle: null,
        routePath: null,
        routeEvents: [],
        selectedVehicle: null,
        isRouteSheetOpen: false,
        routeSegmentToFit: null,
        highlightedSegment: null,
        selectedSegmentIndex: null,
        isLoadingRoute: false,
      };

    case 'SELECT_ROUTE_SEGMENT': {
      const segmentIndex = action.payload;
      if (state.selectedSegmentIndex === segmentIndex) {
        // Deselect if clicking the same segment
        return {
          ...state,
          selectedSegmentIndex: null,
          highlightedSegment: null,
          routeSegmentToFit: state.routePath, // Fit entire route
        };
      }
      const { segmentPoints, highlightedSegment } = getSegmentPoints(state, segmentIndex);
      return {
        ...state,
        selectedSegmentIndex: segmentIndex,
        routeSegmentToFit: segmentPoints,
        highlightedSegment: highlightedSegment,
      };
    }
    
    case 'SELECT_MAP_SEGMENT': {
        const pointIndex = action.payload;
        if (!state.routePath || !state.routeEvents || state.routeEvents.length <= 1) return state;

        const pointsPerEvent = (state.routePath.length - 1) / (state.routeEvents.length - 1);
        const segmentIndex = Math.floor(pointIndex / pointsPerEvent);
        
        // Don't re-select if already selected
        if (state.selectedSegmentIndex === segmentIndex) return state;

        const { segmentPoints, highlightedSegment } = getSegmentPoints(state, segmentIndex);
        return {
            ...state,
            selectedSegmentIndex: segmentIndex,
            routeSegmentToFit: segmentPoints,
            highlightedSegment: highlightedSegment,
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

    default:
      return state;
  }
};


// 5. Create the context
interface FleetContextValue {
    state: FleetState;
    dispatch: Dispatch<FleetAction>;
    isLoadingVehicles: boolean;
    error: Error | null;
}

const FleetContext = createContext<FleetContextValue | undefined>(undefined);

async function fetchVehicles(): Promise<Vehicle[]> {
    const response = await fetch('/api/vehicles');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
}

// 6. Create the Provider component
export const FleetProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: initialVehicles, isLoading: isLoadingVehicles, error } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fetchVehicles,
    });
    
    const [state, dispatch] = useReducer(fleetReducer, getInitialState(initialVehicles));

    useEffect(() => {
        if (initialVehicles) {
          dispatch({ type: 'SET_VEHICLES', payload: initialVehicles });
        }
    }, [initialVehicles]);

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
