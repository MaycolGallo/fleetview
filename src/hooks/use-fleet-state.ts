
import { useReducer } from 'react';
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
}

// 2. Define the actions
type FleetAction =
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'SET_STATUS_FILTER'; payload: VehicleStatus | 'all' }
  | { type: 'SELECT_VEHICLE'; payload: Vehicle | null }
  | { type: 'START_ROUTE_LOADING'; payload: Vehicle }
  | { type: 'SET_ROUTE_HISTORY'; payload: { routePoints: { lat: number; lng: number }[]; routeEvents: RouteEvent[] } }
  | { type: 'BACK_TO_FLEET' }
  | { type: 'SELECT_ROUTE_SEGMENT'; payload: number }
  | { type: 'SET_ROUTE_SHEET_OPEN', payload: boolean };


// 3. Define the initial state
const getInitialState = (initialVehicles: Vehicle[]): FleetState => ({
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
});

// 4. Create the reducer function
const fleetReducer = (state: FleetState, action: FleetAction): FleetState => {
  switch (action.type) {
    case 'SET_VEHICLES':
      return { ...state, vehicles: action.payload };

    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload };

    case 'SELECT_VEHICLE':
      return { ...state, selectedVehicle: action.payload };
    
    case 'SET_ROUTE_SHEET_OPEN':
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

      if (!state.routePath || !state.routeEvents) return state;

      // A simple heuristic to map events to points
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
        ...state,
        selectedSegmentIndex: segmentIndex,
        routeSegmentToFit: segmentPoints.length > 0 ? segmentPoints : null,
        highlightedSegment: segmentPoints.length > 1 ? segmentPoints : null,
      };
    }

    default:
      return state;
  }
};

// 5. Create the custom hook
export const useFleetState = (initialVehicles: Vehicle[]) => {
  return useReducer(fleetReducer, getInitialState(initialVehicles));
};
