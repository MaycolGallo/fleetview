
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useFleetState, useFleetDispatch, selectMapVehicles } from '@/context/fleet-context';
import { MapboxVehicleMarker } from './mapbox-vehicle-marker';
import type { FeatureCollection } from 'geojson';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWF5dGVrIiwiYSI6ImNtZDBldWVvaDAyZ2cybG9oM2s2emlwMWIifQ.TwQvSriLHhcTdDnBYPB5KQ';

interface FleetMapboxMapProps {
  side?: 'ida' | 'vuelta';
  miniMapId?: string;
  manualVehicleIds?: number[];
  isMainMap?: boolean;
}

export default function FleetMapboxMap({ side, miniMapId, manualVehicleIds, isMainMap }: FleetMapboxMapProps) {
  const mapRef = useRef<MapRef>(null);
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { 
    isMapDark, 
    mapViewport, 
    vehicles, 
    miniMaps, 
    focusedMiniMapId, 
    routeGroups, 
    incidencias, 
    isIncidenciasSheetOpen, 
    historyVehicle,
    masterRoute,
    isSplitView
  } = state;

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, miniMapId, manualVehicleIds, isMainMap), 
    [state, miniMapId, manualVehicleIds, isMainMap]
  );

  // Viewport Sync
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let targetVehicleIds: number[] = [];
    if (manualVehicleIds) targetVehicleIds = manualVehicleIds;
    else if (miniMapId) targetVehicleIds = miniMaps.find(m => m.id === miniMapId)?.vehicleIds || [];
    else if (isMainMap && focusedMiniMapId) targetVehicleIds = miniMaps.find(m => m.id === focusedMiniMapId)?.vehicleIds || [];

    if (targetVehicleIds.length > 0) {
      const trackedUnits = vehicles.filter(v => targetVehicleIds.includes(v.id_vehiculo));
      if (trackedUnits.length === 1) {
        map.flyTo({ center: [trackedUnits[0].lng, trackedUnits[0].lat], zoom: 16 });
      } else if (trackedUnits.length > 1) {
        const bounds = trackedUnits.reduce((acc, v) => {
          return [[Math.min(acc[0][0], v.lng), Math.min(acc[0][1], v.lat)], [Math.max(acc[1][0], v.lng), Math.max(acc[1][1], v.lat)]] as [[number, number], [number, number]];
        }, [[trackedUnits[0].lng, trackedUnits[0].lat], [trackedUnits[0].lng, trackedUnits[0].lat]]);
        map.fitBounds(bounds, { padding: 50 });
      }
      return;
    }

    if (mapViewport.type === 'idle' || mapViewport.type === 'initial') {
        if (isSplitView && !historyVehicle && !isIncidenciasSheetOpen && masterRoute.length > 0) {
            const halfIndex = Math.ceil(masterRoute.length / 2);
            const points = side === 'ida' ? masterRoute.slice(0, halfIndex) : masterRoute.slice(halfIndex - 1);
            const bounds = points.reduce((acc, p) => {
                return [[Math.min(acc[0][0], p.lng), Math.min(acc[0][1], p.lat)], [Math.max(acc[1][0], p.lng), Math.max(acc[1][1], p.lat)]] as [[number, number], [number, number]];
            }, [[points[0].lng, points[0].lat], [points[0].lng, points[0].lat]]);
            map.fitBounds(bounds, { padding: 50 });
        }
        return;
    }

    switch (mapViewport.type) {
      case 'pan_to_vehicle':
        map.flyTo({ center: [mapViewport.payload.lng, mapViewport.payload.lat], zoom: 15 });
        break;
      case 'fit_bounds':
      case 'fit_route':
        if (mapViewport.payload.length > 0) {
            const bounds = mapViewport.payload.reduce((acc, p) => {
                return [[Math.min(acc[0][0], p.lng), Math.min(acc[0][1], p.lat)], [Math.max(acc[1][0], p.lng), Math.max(acc[1][1], p.lat)]] as [[number, number], [number, number]];
            }, [[mapViewport.payload[0].lng, mapViewport.payload[0].lat], [mapViewport.payload[0].lng, mapViewport.payload[0].lat]]);
            map.fitBounds(bounds, { padding: 100 });
        }
        break;
    }

    dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' });
  }, [mapViewport, side, miniMapId, manualVehicleIds, vehicles, focusedMiniMapId, isSplitView, masterRoute, historyVehicle, isIncidenciasSheetOpen, miniMaps, dispatch, isMainMap]);

  // Route GeoJSON Generation
  const routeGeoJSON = useMemo((): FeatureCollection | null => {
      if (!historyVehicle || isIncidenciasSheetOpen) return null;
      
      const halfIndex = Math.ceil(routeGroups.length / 2);
      const displayGroups = side === 'ida' ? routeGroups.slice(0, halfIndex) : side === 'vuelta' ? routeGroups.slice(halfIndex) : routeGroups;

      return {
          type: 'FeatureCollection',
          features: displayGroups.filter(g => g.id_estado === 6).map(g => ({
              type: 'Feature',
              properties: { color: g.color },
              geometry: {
                  type: 'LineString',
                  coordinates: g.records.map(r => [r.lng, r.lat])
              }
          }))
      };
  }, [routeGroups, side, historyVehicle, isIncidenciasSheetOpen]);

  const masterRouteGeoJSON = useMemo((): FeatureCollection | null => {
      if (!side || historyVehicle || isIncidenciasSheetOpen || !masterRoute.length) return null;
      const half = Math.ceil(masterRoute.length / 2);
      const points = side === 'ida' ? masterRoute.slice(0, half) : masterRoute.slice(half - 1);
      return {
          type: 'FeatureCollection',
          features: [{
              type: 'Feature',
              properties: { color: side === 'vuelta' ? '#3B82F6' : '#22C55E' },
              geometry: {
                  type: 'LineString',
                  coordinates: points.map(p => [p.lng, p.lat])
              }
          }]
      };
  }, [masterRoute, side, historyVehicle, isIncidenciasSheetOpen]);

  const incidenciasGeoJSON = useMemo((): FeatureCollection | null => {
      if (!isIncidenciasSheetOpen || incidencias.length < 2) return null;
      return {
          type: 'FeatureCollection',
          features: [{
              type: 'Feature',
              properties: {},
              geometry: {
                  type: 'LineString',
                  coordinates: incidencias.map(i => [i.lng, i.lat])
              }
          }]
      };
  }, [incidencias, isIncidenciasSheetOpen]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: -12.046374,
          longitude: -77.042793,
          zoom: 13
        }}
        mapStyle={isMapDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12'}
        style={{ width: '100%', height: '100%' }}
      >
        {mapVehicles.map((v, i) => (
          <MapboxVehicleMarker key={v.id_vehiculo} vehicle={v} index={i} />
        ))}

        {/* Polylines */}
        {routeGeoJSON && (
           <Source type="geojson" data={routeGeoJSON}>
             <Layer 
               id="route-history" 
               type="line" 
               paint={{ 
                 'line-color': ['get', 'color'], 
                 'line-width': 6,
                 'line-opacity': 0.8
               }} 
               layout={{ 'line-cap': 'round', 'line-join': 'round' }}
             />
           </Source>
        )}

        {masterRouteGeoJSON && (
            <Source type="geojson" data={masterRouteGeoJSON}>
                <Layer 
                    id="master-route" 
                    type="line" 
                    paint={{ 
                        'line-color': ['get', 'color'], 
                        'line-width': 5,
                        'line-opacity': 0.4,
                        'line-dasharray': [2, 2]
                    }} 
                />
            </Source>
        )}

        {incidenciasGeoJSON && (
            <Source type="geojson" data={incidenciasGeoJSON}>
                <Layer 
                    id="incidencias-path" 
                    type="line" 
                    paint={{ 
                        'line-color': '#EF4444', 
                        'line-width': 4,
                        'line-opacity': 0.6,
                        'line-dasharray': [1, 2]
                    }} 
                />
            </Source>
        )}
      </Map>
    </div>
  );
}
