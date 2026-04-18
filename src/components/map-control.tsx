
"use client";

import { useMap } from '@vis.gl/react-google-maps';
import React, { useEffect, useMemo } from 'react';
import { useFleetState, useFleetDispatch, selectMapVehicles } from '@/context/fleet-context';
import { AnimatedVehicleMarker } from '@/components/vehicle/animated-vehicle-marker';
import { RouteSegments } from '@/components/route/route-polyline';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Flag, Play } from 'lucide-react';
import { IncidenciaMarker } from '@/components/incidencias/incidencia-marker';

interface MapControlProps {
  side?: 'ida' | 'vuelta';
}

export function MapControl({ side }: MapControlProps) {
  const map = useMap();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();

  const {
    mapViewport,
    routeGroups,
    selectedSegmentIndex,
    incidencias,
    selectedIncidenciaId,
    isIncidenciasSheetOpen,
    historyVehicle,
    masterRoute,
    isSplitView
  } = state;

  useEffect(() => {
    if (!map) return;
    google.maps.importLibrary('geometry');
    google.maps.importLibrary('marker');
  }, [map]);


  useEffect(() => {
    if (!map || mapViewport.type === 'idle' || mapViewport.type === 'initial') {
      // Special case for Split View in Fleet Management
      if (map && isSplitView && !historyVehicle && !isIncidenciasSheetOpen && masterRoute.length > 0) {
        const halfIndex = Math.ceil(masterRoute.length / 2);
        const points = side === 'ida' ? masterRoute.slice(0, halfIndex) : masterRoute.slice(halfIndex - 1);
        const bounds = new google.maps.LatLngBounds();
        points.forEach(p => bounds.extend(p));
        map.fitBounds(bounds, 50);
      }
      return;
    }

    switch (mapViewport.type) {
      case 'pan_to_vehicle': {
        const { lat, lng } = mapViewport.payload;
        map.panTo({ lat: lat, lng: lng });
        if (map.getZoom()! < 15) {
          map.setZoom(15);
        }
        break;
      }
      case 'fit_bounds':
      case 'fit_route': {
        const points = mapViewport.payload;
        if (points && points.length > 0) {
          if (points.length === 1) {
            map.panTo(points[0]);
            if (map.getZoom()! < 15) {
                map.setZoom(15);
            }
          } else {
            const bounds = new google.maps.LatLngBounds();
            points.forEach(point => bounds.extend(point));
            map.fitBounds(bounds, 100);
          }
        }
        break;
      }
      default:
        break;
    }
    dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' });

  }, [map, mapViewport, dispatch, isSplitView, historyVehicle, isIncidenciasSheetOpen, masterRoute, side]);

  const mapVehicles = useMemo(() => selectMapVehicles(state), [state]);

  const halfIndex = Math.ceil(routeGroups.length / 2);
  const displayGroups = side === 'ida' 
    ? routeGroups.slice(0, halfIndex) 
    : side === 'vuelta' 
      ? routeGroups.slice(halfIndex) 
      : routeGroups;

  const firstRecord = displayGroups?.[0]?.records?.[0];
  const lastGroup = displayGroups?.[displayGroups.length - 1];
  const lastRecord = lastGroup?.records?.[lastGroup.records.length - 1];

  return (
    <>
      {mapVehicles.map((vehicle) => (
        <AnimatedVehicleMarker
          key={vehicle.id_vehiculo}
          vehicle={vehicle}
        />
      ))}

      <RouteSegments side={side} />
      
      {historyVehicle && firstRecord && lastRecord && selectedSegmentIndex === null && !isIncidenciasSheetOpen && (
        <>
          <AdvancedMarker
            position={{ lat: firstRecord.lat, lng: firstRecord.lng }}
            zIndex={4}
          >
            <div className="flex flex-col items-center">
              <div className="bg-card/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-md mb-1 whitespace-nowrap">
                {side === 'vuelta' ? 'Inicia Vuelta' : 'Start'}
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-card"
                style={{ backgroundColor: '#00CC33' }}
              >
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
            </div>
          </AdvancedMarker>

          <AdvancedMarker
            position={{ lat: lastRecord.lat, lng: lastRecord.lng }}
            zIndex={4}
          >
            <div className="flex flex-col items-center">
              <div className="bg-card/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-md mb-1 whitespace-nowrap">
                {side === 'ida' ? 'Fin Ida' : 'Finish'}
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-card bg-destructive"
              >
                <Flag className="w-4 h-4 text-white" />
              </div>
            </div>
          </AdvancedMarker>
        </>
      )}

      {/* Incidencia Markers */}
      {isIncidenciasSheetOpen && incidencias.map((inc) => (
        <IncidenciaMarker
          key={inc.id}
          incidencia={inc}
          isSelected={selectedIncidenciaId === inc.id}
          onClick={() => dispatch({ type: 'SELECT_INCIDENCIA', payload: inc.id })}
        />
      ))}
    </>
  );
}
