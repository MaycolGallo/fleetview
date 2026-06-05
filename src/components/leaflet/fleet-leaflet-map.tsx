'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, Polyline, CircleMarker } from 'react-leaflet';
import { useFleetState, useFleetDispatch, selectMapVehicles } from '@/context/fleet-context';
import { LeafletVehicleMarker } from './leaflet-vehicle-marker';
import L from 'leaflet';

interface MapSyncProps {
  state: any;
  dispatch: any;
  side?: string;
  miniMapId?: string;
  manualVehicleIds?: number[];
  isMainMap?: boolean;
}

function MapSync({ state, dispatch, side, miniMapId, manualVehicleIds, isMainMap }: MapSyncProps) {
  const map = useMap();
  const { mapViewport, vehicles, miniMaps, focusedMiniMapId, isSplitView, masterRoute, historyVehicle, isIncidenciasSheetOpen } = state;

  useEffect(() => {
    if (!map) return;

    // 1. Determine targets for this instance
    let targetVehicleIds: number[] = [];
    if (manualVehicleIds) targetVehicleIds = manualVehicleIds;
    else if (miniMapId) targetVehicleIds = miniMaps.find((m: any) => m.id === miniMapId)?.vehicleIds || [];
    else if (isMainMap && focusedMiniMapId) targetVehicleIds = miniMaps.find((m: any) => m.id === focusedMiniMapId)?.vehicleIds || [];

    if (targetVehicleIds.length > 0) {
      const trackedUnits = vehicles.filter((v: any) => targetVehicleIds.includes(v.id_vehiculo));
      if (trackedUnits.length === 1) {
        map.setView([trackedUnits[0].lat, trackedUnits[0].lng], 16, { animate: true });
      } else if (trackedUnits.length > 1) {
        const bounds = L.latLngBounds(trackedUnits.map((v: any) => [v.lat, v.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      return;
    }

    // 2. Viewport Actions
    if (mapViewport.type === 'idle' || mapViewport.type === 'initial') {
       if (isSplitView && !historyVehicle && !isIncidenciasSheetOpen && masterRoute.length > 0) {
         const halfIndex = Math.ceil(masterRoute.length / 2);
         const points = side === 'ida' ? masterRoute.slice(0, halfIndex) : masterRoute.slice(halfIndex - 1);
         const bounds = L.latLngBounds(points.map((p: any) => [p.lat, p.lng]));
         map.fitBounds(bounds, { padding: [50, 50] });
       }
       return;
    }

    switch (mapViewport.type) {
      case 'pan_to_vehicle':
        map.setView([mapViewport.payload.lat, mapViewport.payload.lng], 15, { animate: true });
        break;
      case 'fit_bounds':
      case 'fit_route':
        if (mapViewport.payload.length > 0) {
          const bounds = L.latLngBounds(mapViewport.payload.map((p: any) => [p.lat, p.lng]));
          map.fitBounds(bounds, { padding: [100, 100] });
        }
        break;
    }

    dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' });
  }, [map, mapViewport, dispatch, side, miniMapId, manualVehicleIds, vehicles, focusedMiniMapId, isSplitView, masterRoute, historyVehicle, isIncidenciasSheetOpen]);

  return null;
}

interface FleetLeafletMapProps {
  side?: 'ida' | 'vuelta';
  miniMapId?: string;
  manualVehicleIds?: number[];
  isMainMap?: boolean;
}

export default function FleetLeafletMap({ side, miniMapId, manualVehicleIds, isMainMap }: FleetLeafletMapProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { isMapDark, routeGroups, incidencias, isIncidenciasSheetOpen, historyVehicle } = state;

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, miniMapId, manualVehicleIds, isMainMap), 
    [state, miniMapId, manualVehicleIds, isMainMap]
  );

  // Use standard OpenStreetMap for light mode as requested, and Carto Dark for dark mode
  const tileUrl = isMapDark 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = isMapDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[-12.046374, -77.042793]} 
        zoom={13} 
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer url={tileUrl} attribution={attribution} />
        
        <MapSync 
          state={state} 
          dispatch={dispatch} 
          side={side} 
          miniMapId={miniMapId} 
          manualVehicleIds={manualVehicleIds}
          isMainMap={isMainMap}
        />

        {mapVehicles.map((vehicle, idx) => (
          <LeafletVehicleMarker key={vehicle.id_vehiculo} vehicle={vehicle} index={idx} />
        ))}

        {/* Route visualization for history mode */}
        {historyVehicle && !isIncidenciasSheetOpen && routeGroups.map((group, idx) => {
           if (group.id_estado === 6) {
             const points = group.records.map(r => [r.lat, r.lng] as [number, number]);
             return <Polyline key={idx} positions={points} color={group.color} weight={4} opacity={0.8} />;
           }
           if (group.id_estado === 4 || group.id_estado === 5) {
             const first = group.records[0];
             return (
                <CircleMarker 
                  key={idx} 
                  center={[first.lat, first.lng]} 
                  radius={6} 
                  pathOptions={{ fillColor: group.color, color: 'white', weight: 2, fillOpacity: 1 }}
                />
             );
           }
           return null;
        })}

        {/* Incidencias path */}
        {isIncidenciasSheetOpen && incidencias.length > 1 && (
           <Polyline 
             positions={incidencias.map(i => [i.lat, i.lng] as [number, number])} 
             color="#EF4444" 
             weight={3} 
             dashArray="5, 10"
           />
        )}
      </MapContainer>
    </div>
  );
}
