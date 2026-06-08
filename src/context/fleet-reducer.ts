'use client';

import type { FleetState, MiniMapGroup, MapProvider, PanelType, MapType } from '@/lib/types';
import { DESPACHO_BASE_ROUTE, SIMULATION_ROUTE } from '@/services/fleet-api';

export type FleetAction =
  | { type: 'SET_VEHICLES'; payload: any[] }
  | { type: 'UPDATE_VEHICLE_POSITIONS'; payload: { id: number, lat: number, lng: number, status?: any }[] }
  | { type: 'SELECT_VEHICLE'; payload: any | null }
  | { type: 'PAN_TO_VEHICLE'; payload: any | null }
  | { type: 'TOGGLE_VEHICLE_VISIBILITY'; payload: number }
  | { type: 'SET_ALL_VEHICLES_VISIBILITY'; payload: { ids: number[], visible: boolean } }
  | { type: 'SET_STATUS_FILTER'; payload: string[] }
  | { type: 'SET_ACTIVE_PANEL'; payload: PanelType }
  | { type: 'START_ROUTE_LOADING'; payload: any }
  | { type: 'SET_ROUTE_HISTORY'; payload: any }
  | { type: 'SELECT_ROUTE_SEGMENT'; payload: number }
  | { type: 'BACK_TO_FLEET' }
  | { type: 'SET_MAP_DARK_MODE'; payload: boolean }
  | { type: 'SET_MAP_PROVIDER'; payload: MapProvider }
  | { type: 'SET_MAP_TYPE'; payload: MapType }
  | { type: 'TOGGLE_TRAFFIC' }
  | { type: 'TOGGLE_SPLIT_VIEW' }
  | { type: 'TOGGLE_SPLIT_DIRECTION' }
  | { type: 'VIEWPORT_ACTION_COMPLETE' }
  | { type: 'SIMULATE_VEHICLE_MOVE'; payload: number }
  | { type: 'START_ROUTE_PLAYBACK' }
  | { type: 'PAUSE_ROUTE_PLAYBACK' }
  | { type: 'UPDATE_HISTORY_VEHICLE_POSITION'; payload: { lat: number, lng: number, rumbo: number, velocidad: number, animationDuration: number } }
  | { type: 'INIT_PERSISTED_STATE'; payload: { miniMaps: MiniMapGroup[], visibleIds: string[] } }
  | { type: 'SET_MINIMAPS'; payload: MiniMapGroup[] }
  | { type: 'CREATE_MINIMAP'; payload: { vehicleId: number } }
  | { type: 'CREATE_MINIMAP_MANUAL'; payload: { name: string } }
  | { type: 'UPDATE_MINIMAP_VEHICLES'; payload: { miniMapId: string, vehicleIds: number[] } }
  | { type: 'ADD_VEHICLE_TO_MINIMAP'; payload: { miniMapId: string, vehicleId: number } }
  | { type: 'REMOVE_VEHICLE_FROM_MINIMAP'; payload: { miniMapId: string, vehicleId: number } }
  | { type: 'REMOVE_MINIMAP'; payload: string }
  | { type: 'TOGGLE_MINIMAP_VISIBILITY'; payload: string }
  | { type: 'FOCUS_MINIMAP'; payload: string }
  | { type: 'UNFOCUS_MINIMAP' }
  | { type: 'CLEAR_ALL_MINIMAPS' }
  | { type: 'START_INCIDENCIAS_LOADING'; payload: any }
  | { type: 'SET_INCIDENCIAS'; payload: any[] }
  | { type: 'SELECT_INCIDENCIA'; payload: string | null }
  | { type: 'CLOSE_INCIDENCIAS' }
  | { type: 'ADD_NOTIFICATION'; payload: any }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_AI_INSIGHT'; payload: string }
  | { type: 'SET_AI_INSIGHT_LOADING'; payload: boolean }
  | { type: 'SET_AI_PATROL_LOADING'; payload: boolean };

export const getInitialState = (): FleetState => ({
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
  visibleMiniMapIds: [],
  allTrackedVehicleIds: [],
  focusedMiniMapId: null,
  isMapDark: false,
  mapProvider: 'google',
  mapType: 'standard',
  showTraffic: false,
  mapViewport: { type: 'initial' },
  simulationStep: {},
  pinRotationMode: 'arrow',
  isRoutePlaying: false,
  playbackAnimationDuration: 1000,
  isSplitView: false,
  splitDirection: 'horizontal',
  wasSplitViewBeforeRoute: false,
  activePanel: 'vehicles',
  incidencias: [],
  isLoadingIncidencias: false,
  isIncidenciasSheetOpen: false,
  selectedIncidenciaId: null,
  notifications: [],
  despachoBaseRoute: DESPACHO_BASE_ROUTE,
  isLoadingAiInsight: false,
  isSimulatingAiPatrol: false,
});

const getTrackedIds = (miniMaps: MiniMapGroup[]) => {
  const ids = new Set<number>();
  miniMaps.forEach(m => m.vehicleIds.forEach(id => ids.add(id)));
  return Array.from(ids);
};

export const fleetReducer = (state: FleetState, action: FleetAction): FleetState => {
  switch (action.type) {
    case 'SET_VEHICLES': {
      const newVisibleIds = state.vehicles.length === 0 
        ? new Set(action.payload.map(v => v.id_vehiculo))
        : state.visibleVehicleIds;
    
      const visibleVehicles = action.payload.filter(v => newVisibleIds.has(v.id_vehiculo));
      const newBounds = visibleVehicles.length > 0 ? visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng })) : [];
      const updatedSelectedVehicle = state.selectedVehicle ? action.payload.find(v => v.id_vehiculo === state.selectedVehicle!.id_vehiculo) || null : null;

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
    case 'PAN_TO_VEHICLE': {
      if (action.payload === null) return { ...state, selectedVehicle: null };
      return {
        ...state,
        selectedVehicle: action.payload,
        mapViewport: { 
            type: 'pan_to_vehicle', 
            payload: { lat: action.payload.lat, lng: action.payload.lng },
            vehicleId: action.payload.id_vehiculo
        }
      };
    }
    case 'START_ROUTE_LOADING': {
      const isRefreshing = state.historyVehicle?.id_vehiculo === action.payload.id_vehiculo;
      return { ...state, selectedVehicle: null, isLoadingRoute: true, historyVehicle: isRefreshing ? state.historyVehicle : action.payload, isIncidenciasSheetOpen: false, isRouteSheetOpen: isRefreshing ? state.isRouteSheetOpen : false, wasSplitViewBeforeRoute: state.isSplitView, isSplitView: false };
    }
    case 'SET_ROUTE_HISTORY': {
        const historyData = action.payload;
        const filteredGroups = historyData.groups.filter(group => group.total_time_seconds > 60);
        const routePoints = filteredGroups.filter(g => g.id_estado === 6).map(g => g.records.map(r => ({ lat: r.lat, lng: r.lng })));
        const startOfRoute = filteredGroups?.[0]?.records?.[0];
        const updatedHistoryVehicle = state.historyVehicle && startOfRoute ? { ...state.historyVehicle, lat: startOfRoute.lat, lng: startOfRoute.lng, rumbo: startOfRoute?.rumbo || 0, velocidad: "0" } : state.historyVehicle;
        return { ...state, isLoadingRoute: false, routePath: routePoints, routeGroups: filteredGroups, by_estado: historyData.by_estado, isRouteSheetOpen: true, historyVehicle: updatedHistoryVehicle, isRoutePlaying: false, lastUpdatedRoute: Date.now(), mapViewport: { type: 'fit_route', payload: routePoints.flat() } };
    }
    case 'SELECT_ROUTE_SEGMENT': {
      const segmentIndex = action.payload;
      const { selectedSegmentIndex, routeGroups, historyVehicle } = state;
      if (!historyVehicle) return state;
      
      if (selectedSegmentIndex === segmentIndex) {
        const startOfRoute = routeGroups?.[0]?.records?.[0];
        return { ...state, selectedSegmentIndex: null, historyVehicle: startOfRoute ? { ...historyVehicle, lat: startOfRoute.lat, lng: startOfRoute.lng } : historyVehicle, mapViewport: { type: 'fit_route', payload: state.routePath?.flat() || [] } };
      }
      
      const segmentToSelect = routeGroups[segmentIndex];
      if (!segmentToSelect?.records?.length) return state;
      
      const lastRecord = segmentToSelect.records[segmentToSelect.records.length - 1];
      const updatedHistory = { ...historyVehicle, lat: lastRecord.lat, lng: lastRecord.lng, id_estado: segmentToSelect.id_estado, velocidad: String(Math.round(segmentToSelect.avg_velocidad)), rumbo: lastRecord.rumbo || historyVehicle.rumbo, statusName: segmentToSelect.description, statusColor: segmentToSelect.color || historyVehicle.statusColor };
      const viewportPoints = segmentToSelect.id_estado === 6 ? segmentToSelect.records.map(r => ({ lat: r.lat, lng: r.lng })) : [{ lat: lastRecord.lat, lng: lastRecord.lng }];

      return { ...state, selectedSegmentIndex: segmentIndex, historyVehicle: updatedHistory, mapViewport: { type: 'fit_route', payload: viewportPoints } };
    }
    case 'CREATE_MINIMAP_MANUAL': {
        const newId = `map-${Date.now()}`;
        const newMap: MiniMapGroup = { id: newId, name: action.payload.name, vehicleIds: [] };
        const newMaps = [...state.miniMaps, newMap];
        return { ...state, miniMaps: newMaps, visibleMiniMapIds: [...state.visibleMiniMapIds, newId], allTrackedVehicleIds: getTrackedIds(newMaps) };
    }
    case 'UPDATE_MINIMAP_VEHICLES': {
        const newMaps = state.miniMaps.map(m => m.id === action.payload.miniMapId ? { ...m, vehicleIds: action.payload.vehicleIds } : m);
        return { ...state, miniMaps: newMaps, allTrackedVehicleIds: getTrackedIds(newMaps) };
    }
    case 'BACK_TO_FLEET': {
        const visibleVehicles = state.vehicles.filter(v => state.visibleVehicleIds.has(v.id_vehiculo));
        const newBounds = visibleVehicles.length > 0 ? visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng })) : [];
        return { ...state, historyVehicle: null, routePath: null, routeGroups: [], by_estado: {}, selectedVehicle: null, isRouteSheetOpen: false, selectedSegmentIndex: null, isLoadingRoute: false, isRoutePlaying: false, isSplitView: state.wasSplitViewBeforeRoute, wasSplitViewBeforeRoute: false, focusedMiniMapId: null, mapViewport: { type: 'fit_bounds', payload: newBounds } };
    }
    case 'TOGGLE_MINIMAP_VISIBILITY': {
      const isVisible = state.visibleMiniMapIds.includes(action.payload);
      return { ...state, visibleMiniMapIds: isVisible ? state.visibleMiniMapIds.filter(id => id !== action.payload) : [...state.visibleMiniMapIds, action.payload] };
    }
    case 'FOCUS_MINIMAP': {
      const group = state.miniMaps.find(m => m.id === action.payload);
      if (!group) return state;
      const groupVehicles = state.vehicles.filter(v => group.vehicleIds.includes(v.id_vehiculo));
      return { ...state, focusedMiniMapId: action.payload, mapViewport: groupVehicles.length > 0 ? { type: 'fit_bounds', payload: groupVehicles.map(v => ({ lat: v.lat, lng: v.lng })) } : state.mapViewport };
    }
    case 'UNFOCUS_MINIMAP': {
      const visibleVehicles = state.vehicles.filter(v => state.visibleVehicleIds.has(v.id_vehiculo));
      return { ...state, focusedMiniMapId: null, mapViewport: { type: 'fit_bounds', payload: visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng })) } };
    }
    case 'SET_ACTIVE_PANEL': return { ...state, activePanel: action.payload };
    case 'SET_MAP_PROVIDER': return { ...state, mapProvider: action.payload };
    case 'TOGGLE_SPLIT_VIEW': return { ...state, isSplitView: !state.isSplitView };
    case 'VIEWPORT_ACTION_COMPLETE': return { ...state, mapViewport: { type: 'idle' } };
    case 'REMOVE_MINIMAP': {
      const newMaps = state.miniMaps.filter(m => m.id !== action.payload);
      return { ...state, miniMaps: newMaps, visibleMiniMapIds: state.visibleMiniMapIds.filter(id => id !== action.payload), allTrackedVehicleIds: getTrackedIds(newMaps) };
    }
    case 'CLEAR_ALL_MINIMAPS': return { ...state, miniMaps: [], visibleMiniMapIds: [], allTrackedVehicleIds: [], focusedMiniMapId: null };
    default: return state;
  }
};
