
'use client';

import type { Vehicle, VehicleStatus, VHistorial, MapViewport, FleetState, Incidencia, Notification, MiniMapGroup } from '@/lib/types';
import { MASTER_FLEET_ROUTE, SIMULATION_ROUTE } from '@/services/fleet-api';

export type FleetAction =
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'SET_MINIMAPS'; payload: MiniMapGroup[] }
  | { type: 'TOGGLE_MINIMAP_VISIBILITY'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: VehicleStatus[] }
  | { type: 'PAN_TO_VEHICLE'; payload: Vehicle | null }
  | { type: 'START_ROUTE_LOADING'; payload: Vehicle }
  | { type: 'SET_ROUTE_HISTORY'; payload: VHistorial }
  | { type: 'BACK_TO_FLEET' }
  | { type: 'SELECT_ROUTE_SEGMENT'; payload: number }
  | { type: 'SET_ROUTE_SHEET_OPEN', payload: boolean }
  | { type: 'TOGGLE_VEHICLE_VISIBILITY', payload: number }
  | { type: 'CREATE_MINIMAP', payload: { vehicleId: number } }
  | { type: 'CREATE_MINIMAP_MANUAL', payload: { name: string } }
  | { type: 'UPDATE_MINIMAP_VEHICLES', payload: { miniMapId: string, vehicleIds: number[] } }
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
  | { type: 'TOGGLE_TRACK_VEHICLE'; payload: number }
  | { type: 'FOCUS_MINIMAP'; payload: string }
  | { type: 'UNFOCUS_MINIMAP' }
  | { type: 'SET_AI_INSIGHT'; payload: string }
  | { type: 'SET_AI_INSIGHT_LOADING'; payload: boolean }
  | { type: 'INIT_PERSISTED_STATE'; payload: { miniMaps: MiniMapGroup[], visibleIds: string[] } };

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
  trackedVehicleIds: [],
  focusedMiniMapId: null,
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
  isLoadingAiInsight: false,
});

const getTrackedIds = (miniMaps: MiniMapGroup[]) => {
  const ids = new Set<number>();
  miniMaps.forEach(m => m.vehicleIds.forEach(id => ids.add(id)));
  return Array.from(ids);
};

const isUserGroup = (id: string) => id.startsWith('map-');

export const fleetReducer = (state: FleetState, action: FleetAction): FleetState => {
  switch (action.type) {
    case 'SET_MINIMAPS': {
        const existingIds = new Set(state.miniMaps.map(m => m.id));
        const newMiniMaps = [...state.miniMaps];
        
        action.payload.forEach(fetchedMap => {
            if (!existingIds.has(fetchedMap.id)) {
                newMiniMaps.push(fetchedMap);
            }
        });

        return {
            ...state,
            miniMaps: newMiniMaps,
            trackedVehicleIds: getTrackedIds(newMiniMaps)
        };
    }
    case 'TOGGLE_MINIMAP_VISIBILITY': {
      const isVisible = state.visibleMiniMapIds.includes(action.payload);
      return {
        ...state,
        visibleMiniMapIds: isVisible 
          ? state.visibleMiniMapIds.filter(id => id !== action.payload)
          : [...state.visibleMiniMapIds, action.payload]
      };
    }
    case 'INIT_PERSISTED_STATE': {
      return {
        ...state,
        miniMaps: action.payload.miniMaps,
        visibleMiniMapIds: action.payload.visibleIds,
        trackedVehicleIds: getTrackedIds(action.payload.miniMaps),
      };
    }
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
    case 'SET_AI_INSIGHT':
        return { ...state, aiFleetInsight: action.payload };
    case 'SET_AI_INSIGHT_LOADING':
        return { ...state, isLoadingAiInsight: action.payload };
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload };
    
    case 'PAN_TO_VEHICLE': {
      if (action.payload === null) return { ...state, selectedVehicle: null };
      return {
        ...state,
        selectedVehicle: action.payload,
        mapViewport: { type: 'pan_to_vehicle', payload: { lat: action.payload.lat, lng: action.payload.lng } }
      };
    }

    case 'START_ROUTE_LOADING': {
      const isRefreshing = state.historyVehicle?.id_vehiculo === action.payload.id_vehiculo;
      return {
        ...state,
        selectedVehicle: null,
        isLoadingRoute: true,
        historyVehicle: isRefreshing ? state.historyVehicle : action.payload,
        isIncidenciasSheetOpen: false,
        isRouteSheetOpen: isRefreshing ? state.isRouteSheetOpen : false,
        wasSplitViewBeforeRoute: state.isSplitView,
        isSplitView: false, 
      };
    }

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
            isRouteSheetOpen: true,
            historyVehicle: updatedHistoryVehicle,
            isRoutePlaying: false,
            lastUpdatedRoute: Date.now(),
            mapViewport: state.isIncidenciasSheetOpen 
              ? state.mapViewport 
              : { type: 'fit_route', payload: routePoints.flat() },
        };
    }

    case 'BACK_TO_FLEET': {
        const visibleVehicles = state.vehicles.filter(v => state.visibleVehicleIds.has(v.id_vehiculo));
        const newBounds = visibleVehicles.length > 0 ? visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng })) : [];
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
            focusedMiniMapId: null,
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
      
      return {
        ...state,
        selectedSegmentIndex: segmentIndex,
        historyVehicle: {
          ...historyVehicle,
          lat: lastRecord.lat,
          lng: lastRecord.lng,
          id_estado: segmentToSelect.id_estado,
          velocidad: String(Math.round(segmentToSelect.avg_velocidad)),
          rumbo: lastRecord.rumbo || historyVehicle.rumbo,
          statusName: segmentToSelect.description,
          statusColor: segmentToSelect.color || historyVehicle.statusColor,
        },
        mapViewport: segmentToSelect.id_estado === 6 
          ? { type: 'fit_bounds', payload: segmentToSelect.records.map(r => ({ lat: r.lat, lng: r.lng })) }
          : { type: 'pan_to_vehicle', payload: { lat: lastRecord.lat, lng: lastRecord.lng } }
      };
    }

    case 'START_INCIDENCIAS_LOADING': {
      const isRefreshing = state.historyVehicle?.id_vehiculo === action.payload.id_vehiculo;
      return {
        ...state,
        selectedVehicle: null,
        isLoadingIncidencias: true,
        isLoadingRoute: false,
        historyVehicle: isRefreshing ? state.historyVehicle : action.payload,
        isRouteSheetOpen: false,
        isIncidenciasSheetOpen: isRefreshing ? state.isIncidenciasSheetOpen : false,
        wasSplitViewBeforeRoute: state.isSplitView,
        isSplitView: false,
      };
    }

    case 'SET_INCIDENCIAS':
      return {
        ...state,
        isLoadingIncidencias: false,
        incidencias: action.payload,
        isIncidenciasSheetOpen: true,
        lastUpdatedIncidencias: Date.now(),
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
        if (newVisibleIds.has(action.payload)) newVisibleIds.delete(action.payload);
        else newVisibleIds.add(action.payload);
        return { ...state, visibleVehicleIds: newVisibleIds };
    }

    case 'CREATE_MINIMAP': {
      const newId = `map-${Date.now()}`;
      const newMap: MiniMapGroup = {
        id: newId,
        name: `Radar Lock ${state.miniMaps.length + 1}`,
        vehicleIds: [action.payload.vehicleId]
      };
      const newMaps = [...state.miniMaps, newMap];
      return { 
        ...state, 
        miniMaps: newMaps, 
        visibleMiniMapIds: [...state.visibleMiniMapIds, newId],
        trackedVehicleIds: getTrackedIds(newMaps) 
      };
    }

    case 'CREATE_MINIMAP_MANUAL': {
        const newId = `map-${Date.now()}`;
        const newMap: MiniMapGroup = { id: newId, name: action.payload.name, vehicleIds: [] };
        const newMaps = [...state.miniMaps, newMap];
        return { 
          ...state, 
          miniMaps: newMaps, 
          visibleMiniMapIds: [...state.visibleMiniMapIds, newId],
          trackedVehicleIds: getTrackedIds(newMaps) 
        };
    }

    case 'UPDATE_MINIMAP_VEHICLES': {
        if (!isUserGroup(action.payload.miniMapId)) return state;
        const newMaps = state.miniMaps.map(m => m.id === action.payload.miniMapId ? { ...m, vehicleIds: action.payload.vehicleIds } : m);
        return { ...state, miniMaps: newMaps, trackedVehicleIds: getTrackedIds(newMaps) };
    }

    case 'REMOVE_MINIMAP': {
      const newMaps = state.miniMaps.filter(m => m.id !== action.payload);
      return { 
        ...state, 
        miniMaps: newMaps, 
        visibleMiniMapIds: state.visibleMiniMapIds.filter(id => id !== action.payload),
        trackedVehicleIds: getTrackedIds(newMaps), 
        focusedMiniMapId: state.focusedMiniMapId === action.payload ? null : state.focusedMiniMapId 
      };
    }

    case 'ADD_VEHICLE_TO_MINIMAP': {
      if (!isUserGroup(action.payload.miniMapId)) return state;
      const newMaps = state.miniMaps.map(m => m.id === action.payload.miniMapId ? { ...m, vehicleIds: Array.from(new Set([...m.vehicleIds, action.payload.vehicleId])) } : m);
      return { ...state, miniMaps: newMaps, trackedVehicleIds: getTrackedIds(newMaps) };
    }

    case 'REMOVE_VEHICLE_FROM_MINIMAP': {
      if (!isUserGroup(action.payload.miniMapId)) return state;
      const newMaps = state.miniMaps.map(m => m.id === action.payload.miniMapId ? { ...m, vehicleIds: m.vehicleIds.filter(id => id !== action.payload.vehicleId) } : m);
      return { ...state, miniMaps: newMaps, trackedVehicleIds: getTrackedIds(newMaps) };
    }

    case 'CLEAR_ALL_MINIMAPS':
      return { ...state, miniMaps: [], visibleMiniMapIds: [], trackedVehicleIds: [], focusedMiniMapId: null };

    case 'TOGGLE_TRACK_VEHICLE': {
      const isAlreadyTracked = state.trackedVehicleIds?.includes(action.payload) || false;
      if (isAlreadyTracked) {
        // Only allow removing from user-created maps via this shortcut
        const newMaps = state.miniMaps.map(m => {
            if (isUserGroup(m.id)) {
                return { ...m, vehicleIds: m.vehicleIds.filter(id => id !== action.payload) };
            }
            return m;
        }).filter(m => m.vehicleIds.length > 0 || !isUserGroup(m.id));
        
        return { ...state, miniMaps: newMaps, trackedVehicleIds: getTrackedIds(newMaps) };
      } else {
        const newId = `map-${Date.now()}`;
        const newMap: MiniMapGroup = { id: newId, name: `Radar Lock ${state.miniMaps.length + 1}`, vehicleIds: [action.payload] };
        const newMaps = [...state.miniMaps, newMap];
        return { 
          ...state, 
          miniMaps: newMaps, 
          visibleMiniMapIds: [...state.visibleMiniMapIds, newId],
          trackedVehicleIds: getTrackedIds(newMaps) 
        };
      }
    }

    case 'FOCUS_MINIMAP': {
      const group = state.miniMaps.find(m => m.id === action.payload);
      if (!group) return state;
      const groupVehicles = state.vehicles.filter(v => group.vehicleIds.includes(v.id_vehiculo));
      return {
        ...state,
        focusedMiniMapId: action.payload,
        mapViewport: groupVehicles.length > 0 ? { type: 'fit_bounds', payload: groupVehicles.map(v => ({ lat: v.lat, lng: v.lng })) } : state.mapViewport
      };
    }

    case 'UNFOCUS_MINIMAP': {
      const visibleVehicles = state.vehicles.filter(v => state.visibleVehicleIds.has(v.id_vehiculo));
      return {
        ...state,
        focusedMiniMapId: null,
        mapViewport: { type: 'fit_bounds', payload: visibleVehicles.map(v => ({ lat: v.lat, lng: v.lng })) }
      };
    }

    case 'SET_ALL_VEHICLES_VISIBILITY': {
        const newVisibleIds = new Set(state.visibleVehicleIds);
        if (action.payload.visible) action.payload.ids.forEach(id => newVisibleIds.add(id));
        else action.payload.ids.forEach(id => newVisibleIds.delete(id));
        return { ...state, visibleVehicleIds: newVisibleIds };
    }
    
    case 'SET_MAP_DARK_MODE':
      return { ...state, isMapDark: action.payload };

    case 'SIMULATE_VEHICLE_MOVE': {
      const vehicleId = action.payload;
      const currentStep = state.simulationStep[vehicleId] || 0;
      const nextStep = (currentStep + 1) % SIMULATION_ROUTE.length;
      const newCoords = SIMULATION_ROUTE[nextStep];
      return {
        ...state,
        vehicles: state.vehicles.map(v => v.id_vehiculo === vehicleId ? { ...v, lat: newCoords.lat, lng: newCoords.lng } : v),
        simulationStep: { ...state.simulationStep, [vehicleId]: nextStep }
      };
    }

    case 'VIEWPORT_ACTION_COMPLETE':
        return { ...state, mapViewport: { type: 'idle' } };

    case 'START_ROUTE_PLAYBACK':
        return { ...state, isRoutePlaying: true, historyVehicle: state.historyVehicle ? { ...state.historyVehicle, id_estado: 6 } : state.historyVehicle };

    case 'PAUSE_ROUTE_PLAYBACK':
        return { ...state, isRoutePlaying: false };

    case 'TOGGLE_SPLIT_VIEW':
        return { ...state, isSplitView: !state.isSplitView };

    case 'TOGGLE_SPLIT_DIRECTION':
        return { ...state, splitDirection: state.splitDirection === 'horizontal' ? 'vertical' : 'horizontal' };

    case 'UPDATE_HISTORY_VEHICLE_POSITION': {
        if (!state.historyVehicle) return state;
        const { lat, lng, rumbo, velocidad, animationDuration } = action.payload;
        return {
            ...state,
            historyVehicle: {
                ...state.historyVehicle,
                lat, lng, rumbo,
                velocidad: String(velocidad),
                id_estado: 6,
                statusName: 'Transitando',
                statusColor: '#00CC33',
            },
            playbackAnimationDuration: animationDuration,
        };
    }

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications].slice(0, 50) };

    case 'MARK_NOTIFICATION_READ':
      return { ...state, notifications: state.notifications.map(n => n.id === action.payload ? { ...n, isRead: true } : n) };

    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };

    default:
      return state;
  }
};
