
'use client';

import type { FleetState, Geofence, MiniMapGroup, MapProvider, PanelType, MapType, RemoteActionRecord } from '@/lib/types';
import { DESPACHO_BASE_ROUTE } from '@/services/fleet-api';
import { getVehicleStatusDefinition } from '@/lib/vehicle-status';

export type FleetAction =
  | { type: 'SET_VEHICLES'; payload: any[] }
  | { type: 'UPDATE_VEHICLE_POSITIONS'; payload: { id_vehiculo: number; lat: number; lng: number; rumbo?: number; id_estado?: number; status?: string; statusName?: string; statusColor?: string; velocidad?: string; fecha?: number; odometro?: string; senal_gsm?: number; nivel_bateria_vehicular?: string }[] }
  | { type: 'SELECT_VEHICLE'; payload: any | null }
  | { type: 'PAN_TO_VEHICLE'; payload: any | null }
  | { type: 'TOGGLE_VEHICLE_VISIBILITY'; payload: number }
  | { type: 'SET_ALL_VEHICLES_VISIBILITY'; payload: { ids: number[], visible: boolean } }
  | { type: 'SET_STATUS_FILTER'; payload: string[] }
  | { type: 'SET_ACTIVE_PANEL'; payload: PanelType }
  | { type: 'ADD_GEOFENCE'; payload: Geofence }
  | { type: 'REMOVE_GEOFENCE'; payload: string }
  | { type: 'TOGGLE_GEOFENCE'; payload: string }
  | { type: 'START_ROUTE_LOADING'; payload: any }
  | { type: 'SET_ROUTE_HISTORY'; payload: any }
  | { type: 'HIDE_ROUTE_SHEET' }
  | { type: 'SELECT_ROUTE_SEGMENT'; payload: number }
  | { type: 'BACK_TO_FLEET' }
  | { type: 'SET_MAP_DARK_MODE'; payload: boolean }
  | { type: 'SET_MAP_PROVIDER'; payload: MapProvider }
  | { type: 'SET_MAP_TYPE'; payload: MapType }
  | { type: 'TOGGLE_TRAFFIC' }
  | { type: 'TOGGLE_SPLIT_VIEW' }
  | { type: 'TOGGLE_SPLIT_DIRECTION' }
  | { type: 'VIEWPORT_ACTION_COMPLETE' }
  | { type: 'SIMULATE_VEHICLE_MOVE'; payload: { elapsedSeconds: number; timestamp: number; vehicleId?: number } }
  | { type: 'START_ROUTE_PLAYBACK' }
  | { type: 'PAUSE_ROUTE_PLAYBACK' }
  | { type: 'UPDATE_HISTORY_VEHICLE_POSITION'; payload: { lat: number, lng: number, rumbo: number, velocidad: number, animationDuration: number } }
  | { type: 'SET_PLAYBACK_INDEX'; payload: number }
  | { type: 'ADD_REMOTE_ACTION_RECORD'; payload: { vehicleId: number; record: RemoteActionRecord } }
  | { type: 'SET_REMOTE_ACTIONS_FILTER'; payload: { inProgress: boolean; failed: boolean } }
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
  | { type: 'SET_AI_PATROL_LOADING'; payload: boolean }
  | { type: 'TOGGLE_MARKER_CLUSTERING'; payload?: boolean }
  | { type: 'SET_MAP_CONTROL_PADDING'; payload: { top: number, right: number, bottom: number, left: number } };

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
  mapProvider: 'leaflet',
  mapType: 'standard',
  showTraffic: false,
  mapViewport: { type: 'initial' },
  simulationStep: {},
  pinRotationMode: 'arrow',
  isRoutePlaying: false,
  playbackAnimationDuration: 1000,
  playbackIndex: 0,
  isSplitView: false,
  splitDirection: 'horizontal',
  wasSplitViewBeforeRoute: false,
  activePanel: 'vehicles',
  geofences: [
    { id: 'demo-depot', name: 'Depósito Central', shape: 'circle', center: { lat: -12.046374, lng: -77.042793 }, radius: 450, polygon: null, event: 'enter', vehicleId: null, enabled: true },
    { id: 'demo-yard', name: 'Patio de Operaciones', shape: 'polygon', center: null, radius: null, polygon: [{ lat: -12.041, lng: -77.051 }, { lat: -12.038, lng: -77.047 }, { lat: -12.043, lng: -77.043 }, { lat: -12.047, lng: -77.047 }], event: 'enter_first', vehicleId: null, enabled: true },
  ],
  incidencias: [],
  isLoadingIncidencias: false,
  isIncidenciasSheetOpen: false,
  selectedIncidenciaId: null,
  notifications: [],
  despachoBaseRoute: DESPACHO_BASE_ROUTE,
  isLoadingAiInsight: false,
  isSimulatingAiPatrol: false,
  enableMarkerClustering: true,
  mapControlPadding: { top: 80, right: 440, bottom: 80, left: 80 },
  remoteActionHistory: new Map(),
  remoteActionsFilterInProgress: false,
  remoteActionsFilterFailed: false,
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

    case 'UPDATE_VEHICLE_POSITIONS': {
      if (action.payload.length === 0) return state;

      const positionsByVehicleId = new Map(
        action.payload.map((position) => [position.id_vehiculo, position]),
      );
      const vehicles = state.vehicles.map((vehicle) => {
        const position = positionsByVehicleId.get(vehicle.id_vehiculo);
        return position
          ? {
              ...vehicle,
              lat: position.lat,
              lng: position.lng,
              rumbo: position.rumbo ?? vehicle.rumbo,
              id_estado: position.id_estado ?? vehicle.id_estado,
              statusName: position.statusName ?? position.status ?? vehicle.statusName,
              statusColor: position.statusColor ?? vehicle.statusColor,
              velocidad: position.velocidad ?? vehicle.velocidad,
              fecha: position.fecha ?? vehicle.fecha,
              odometro: position.odometro ?? vehicle.odometro,
              senal_gsm: position.senal_gsm ?? vehicle.senal_gsm,
              nivel_bateria_vehicular: position.nivel_bateria_vehicular ?? vehicle.nivel_bateria_vehicular,
            }
          : vehicle;
      });
      const selectedVehicle = state.selectedVehicle
        ? vehicles.find((vehicle) => vehicle.id_vehiculo === state.selectedVehicle?.id_vehiculo) ?? null
        : null;

      return { ...state, vehicles, selectedVehicle };
    }

    case 'SIMULATE_VEHICLE_MOVE': {
      if (state.vehicles.length === 0) return state;

      const elapsedSeconds = Math.min(60, Math.max(0, action.payload.elapsedSeconds));
      if (elapsedSeconds === 0) return state;

      const simulationStep = { ...state.simulationStep };
      let updatedVehicleCount = 0;
      const vehicles = state.vehicles.map((vehicle) => {
        if (action.payload.vehicleId !== undefined && vehicle.id_vehiculo !== action.payload.vehicleId) {
          return vehicle;
        }

        updatedVehicleCount += 1;
        const vehicleKey = String(vehicle.id_vehiculo);
        const tick = (simulationStep[vehicleKey] ?? 0) + 1;
        simulationStep[vehicleKey] = tick;

        const vehicleId = vehicle.id_vehiculo;
        const currentStatusId = vehicle.id_estado;
        const restrictedStatus = [7, 8, 9].includes(currentStatusId);
        let nextStatusId = currentStatusId;

        if (!restrictedStatus) {
          if ([3, 6].includes(currentStatusId) && tick % 90 === vehicleId % 90) {
            nextStatusId = 4;
          } else if ([0, 1, 2, 4, 5, 10].includes(currentStatusId) && tick % 45 === vehicleId % 45) {
            nextStatusId = 6;
          }
        }

        const isMoving = nextStatusId === 3 || nextStatusId === 6;
        const previousSpeed = Number.parseFloat(vehicle.velocidad) || 0;
        const speedChange = ((vehicleId + tick) % 5 - 2) * 1.5;
        const speed = isMoving
          ? Math.max(12, Math.min(110, previousSpeed > 0 ? previousSpeed + speedChange : 24 + (vehicleId % 32)))
          : 0;

        if (isMoving) nextStatusId = speed > 80 ? 3 : 6;
        const status = getVehicleStatusDefinition(nextStatusId);
        const heading = Number(vehicle.rumbo) || 0;
        const nextHeading = isMoving ? (heading + ((vehicleId + tick) % 3 - 1) + 360) % 360 : heading;
        const distanceKm = (speed * elapsedSeconds) / 3600;
        const headingRadians = (nextHeading * Math.PI) / 180;
        const latitudeScale = 111.32;
        const longitudeScale = latitudeScale * Math.max(0.1, Math.cos((vehicle.lat * Math.PI) / 180));
        const voltage = Number.parseFloat(vehicle.nivel_bateria_vehicular) || 12.6;
        const nextVoltage = currentStatusId === 8
          ? voltage
          : isMoving
            ? Math.min(14.4, voltage + elapsedSeconds * 0.01)
            : Math.max(12, voltage - elapsedSeconds * 0.001);
        const signalChange = tick % 15 === 0 ? (vehicleId + tick) % 2 === 0 ? 1 : -1 : 0;

        return {
          ...vehicle,
          lat: vehicle.lat + (distanceKm * Math.cos(headingRadians)) / latitudeScale,
          lng: vehicle.lng + (distanceKm * Math.sin(headingRadians)) / longitudeScale,
          rumbo: nextHeading,
          id_estado: status.id,
          statusName: status.name,
          statusColor: status.color,
          velocidad: speed.toFixed(2),
          fecha: action.payload.timestamp,
          odometro: ((Number.parseFloat(vehicle.odometro) || 0) + distanceKm).toFixed(2),
          senal_gsm: Math.max(0, Math.min(31, vehicle.senal_gsm + signalChange)),
          nivel_bateria_vehicular: nextVoltage.toFixed(2),
        };
      });

      if (updatedVehicleCount === 0) return state;
      const selectedVehicle = state.selectedVehicle
        ? vehicles.find((vehicle) => vehicle.id_vehiculo === state.selectedVehicle?.id_vehiculo) ?? null
        : null;

      return { ...state, vehicles, selectedVehicle, simulationStep };
    }

    case 'PAN_TO_VEHICLE': {
      if (action.payload === null) {
        return { ...state, selectedVehicle: null };
      }
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

    case 'CREATE_MINIMAP': {
      const { vehicleId } = action.payload;
      const vehicle = state.vehicles.find(v => v.id_vehiculo === vehicleId);
      if (!vehicle) return state;

      const newId = `radar-${vehicle.placa}-${Date.now()}`;
      const newMap: MiniMapGroup = {
        id: newId,
        name: `Radar: ${vehicle.placa}`,
        vehicleIds: [vehicleId]
      };

      const updatedMaps = [...state.miniMaps, newMap];
      return {
        ...state,
        miniMaps: updatedMaps,
        visibleMiniMapIds: [...state.visibleMiniMapIds, newId],
        allTrackedVehicleIds: getTrackedIds(updatedMaps)
      };
    }

    case 'CREATE_MINIMAP_MANUAL': {
      const { name } = action.payload;
      const newId = `custom-${Date.now()}`;
      const newMap: MiniMapGroup = {
        id: newId,
        name: name.trim(),
        vehicleIds: []
      };
      
      const updatedMaps = [...state.miniMaps, newMap];
      return {
        ...state,
        miniMaps: updatedMaps,
        visibleMiniMapIds: [...state.visibleMiniMapIds, newId],
        allTrackedVehicleIds: getTrackedIds(updatedMaps)
      };
    }

    case 'UPDATE_MINIMAP_VEHICLES': {
        const { miniMapId, vehicleIds } = action.payload;
        // Predefined groups are read-only per requirement
        if (miniMapId.startsWith('group-')) {
          return state;
        }
        
        const newMaps = state.miniMaps.map(m => m.id === miniMapId ? { ...m, vehicleIds } : m);
        return { 
          ...state, 
          miniMaps: newMaps, 
          allTrackedVehicleIds: getTrackedIds(newMaps) 
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
        isSplitView: false 
      };
    }

    case 'SET_ROUTE_HISTORY': {
        const historyData = action.payload;
        const filteredGroups = historyData.groups.filter((group: any) => group.total_time_seconds > 60);
        const routePoints = filteredGroups.filter((g: any) => g.id_estado === 6).map((g: any) => g.records.map((r: any) => ({ lat: r.lat, lng: r.lng })));
        const startOfRoute = filteredGroups?.[0]?.records?.[0];
        const updatedHistoryVehicle = state.historyVehicle && startOfRoute ? { ...state.historyVehicle, lat: startOfRoute.lat, lng: startOfRoute.lng, rumbo: startOfRoute?.rumbo || 0, velocidad: "0" } : state.historyVehicle;
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
          mapViewport: { type: 'fit_route', payload: routePoints.flat().length > 0 ? routePoints.flat() : (startOfRoute ? [{lat: startOfRoute.lat, lng: startOfRoute.lng}] : []) } 
        };
    }

    case 'HIDE_ROUTE_SHEET':
      return { ...state, isRouteSheetOpen: false };

    case 'SELECT_ROUTE_SEGMENT': {
        const group = state.routeGroups[action.payload];
        if (!group || group.records.length === 0) return { ...state, selectedSegmentIndex: action.payload };
        
        return { 
          ...state, 
          selectedSegmentIndex: action.payload, 
          mapViewport: { type: 'fit_route', payload: group.records.map(r => ({ lat: r.lat, lng: r.lng })) } 
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
          playbackIndex: 0,
          isSplitView: state.wasSplitViewBeforeRoute, 
          wasSplitViewBeforeRoute: false, 
          focusedMiniMapId: null, 
          mapViewport: { type: 'fit_bounds', payload: newBounds } 
        };
    }

    case 'TOGGLE_MINIMAP_VISIBILITY': {
      const id = action.payload;
      const isVisible = state.visibleMiniMapIds.includes(id);
      return { 
        ...state, 
        visibleMiniMapIds: isVisible 
          ? state.visibleMiniMapIds.filter(vId => vId !== id) 
          : [...state.visibleMiniMapIds, id] 
      };
    }

    case 'FOCUS_MINIMAP': {
      const group = state.miniMaps.find(m => m.id === action.payload);
      if (!group) return state;
      const groupVehicles = state.vehicles.filter(v => group.vehicleIds.includes(v.id_vehiculo));
      return { 
        ...state, 
        focusedMiniMapId: action.payload, 
        mapViewport: groupVehicles.length > 0 
          ? { type: 'fit_bounds', payload: groupVehicles.map(v => ({ lat: v.lat, lng: v.lng })) } 
          : state.mapViewport 
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

    case 'SET_MINIMAPS': {
      const existingIds = new Set(state.miniMaps.map(m => m.id));
      const newFromApi = action.payload.filter(m => !existingIds.has(m.id));
      const merged = [...state.miniMaps, ...newFromApi];
      return {
        ...state,
        miniMaps: merged,
        allTrackedVehicleIds: getTrackedIds(merged)
      };
    }

    case 'INIT_PERSISTED_STATE': return { ...state, miniMaps: action.payload.miniMaps, visibleMiniMapIds: action.payload.visibleIds, allTrackedVehicleIds: getTrackedIds(action.payload.miniMaps) };
    case 'SET_MAP_PROVIDER': return { ...state, mapProvider: action.payload };
    case 'SET_MAP_TYPE': return { ...state, mapType: action.payload };
    case 'SET_MAP_DARK_MODE': return { ...state, isMapDark: action.payload };
    case 'TOGGLE_TRAFFIC': return { ...state, showTraffic: !state.showTraffic };
    case 'TOGGLE_SPLIT_VIEW': return { ...state, isSplitView: !state.isSplitView };
    case 'TOGGLE_SPLIT_DIRECTION': return { ...state, splitDirection: state.splitDirection === 'horizontal' ? 'vertical' : 'horizontal' };
    case 'SET_ACTIVE_PANEL': return { ...state, activePanel: action.payload };
  case 'ADD_GEOFENCE': return { ...state, geofences: [...state.geofences, action.payload] };
  case 'REMOVE_GEOFENCE': return { ...state, geofences: state.geofences.filter((geofence) => geofence.id !== action.payload) };
  case 'TOGGLE_GEOFENCE': return { ...state, geofences: state.geofences.map((geofence) => geofence.id === action.payload ? { ...geofence, enabled: !geofence.enabled } : geofence) };
    case 'VIEWPORT_ACTION_COMPLETE': return { ...state, mapViewport: { type: 'idle' } };
    case 'CLEAR_ALL_MINIMAPS': return { ...state, miniMaps: [], visibleMiniMapIds: [], allTrackedVehicleIds: [], focusedMiniMapId: null };
    case 'TOGGLE_MARKER_CLUSTERING': return { ...state, enableMarkerClustering: action.payload ?? !state.enableMarkerClustering };
    case 'SET_MAP_CONTROL_PADDING': return { ...state, mapControlPadding: action.payload };
    case 'SET_PLAYBACK_INDEX': return { ...state, playbackIndex: action.payload };
    case 'START_ROUTE_PLAYBACK': return { ...state, isRoutePlaying: true, playbackIndex: 0 };
    case 'PAUSE_ROUTE_PLAYBACK': return { ...state, isRoutePlaying: false };
    case 'UPDATE_HISTORY_VEHICLE_POSITION': return {
      ...state,
      historyVehicle: state.historyVehicle ? {
        ...state.historyVehicle,
        lat: action.payload.lat,
        lng: action.payload.lng,
        rumbo: action.payload.rumbo,
        velocidad: action.payload.velocidad
      } : state.historyVehicle
    };
    case 'ADD_REMOTE_ACTION_RECORD': {
      const newHistory = new Map(state.remoteActionHistory);
      const vehicleActions = newHistory.get(action.payload.vehicleId) || [];
      newHistory.set(action.payload.vehicleId, [action.payload.record, ...vehicleActions]);
      return { ...state, remoteActionHistory: newHistory };
    }
    case 'SET_REMOTE_ACTIONS_FILTER': return {
      ...state,
      remoteActionsFilterInProgress: action.payload.inProgress,
      remoteActionsFilterFailed: action.payload.failed,
    };
    
    default: return state;
  }
};
