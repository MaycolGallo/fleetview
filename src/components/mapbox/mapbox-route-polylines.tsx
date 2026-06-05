
'use client';

import React, { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl';
import { useFleetState } from '@/context/fleet-context';
import type { FeatureCollection } from 'geojson';

interface MapboxRoutePolylinesProps {
  side?: 'ida' | 'vuelta';
}

/**
 * Manages GeoJSON generation and Layer rendering for Mapbox GL tactical routes.
 */
export function MapboxRoutePolylines({ side }: MapboxRoutePolylinesProps) {
  const { state } = useFleetState();
  const { routeGroups, incidencias, isIncidenciasSheetOpen, historyVehicle, despachoBaseRoute } = state;

  // History Path GeoJSON
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

  // Despacho Base Route GeoJSON
  const despachoRouteGeoJSON = useMemo((): FeatureCollection | null => {
      if (!side || historyVehicle || isIncidenciasSheetOpen || !despachoBaseRoute.length) return null;
      const half = Math.ceil(despachoBaseRoute.length / 2);
      const points = side === 'ida' ? despachoBaseRoute.slice(0, half) : despachoBaseRoute.slice(half - 1);
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
  }, [despachoBaseRoute, side, historyVehicle, isIncidenciasSheetOpen]);

  // Incidents Path GeoJSON
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
    <>
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

        {despachoRouteGeoJSON && (
            <Source type="geojson" data={despachoRouteGeoJSON}>
                <Layer 
                    id="despacho-base-route" 
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
    </>
  );
}
