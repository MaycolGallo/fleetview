"use client";

import { useMap } from '@vis.gl/react-google-maps';
import React, { useEffect, useMemo } from 'react';
import { useFleetState, useFleetDispatch, selectMapVehicles } from '@/context/fleet-context';
import { AnimatedVehicleMarker } from '@/components/vehicle/animated-vehicle-marker';
import { RouteSegments } from '@/components/route/route-polyline';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Flag, Play } from 'lucide-react';
import { IncidenciaMarker } from '@/components/incidencias/incidencia-marker';
import { useMapViewport } from '@/hooks/use-map-viewport';

interface MapControlProps {
  side?: 'ida' | 'vuelta';
  miniMapId?: string;
  manualVehicleIds?: number[];
  isMainMap?: boolean;
}

export function MapControl(props: MapControlProps) {
  const { side, miniMapId, manualVehicleIds, isMainMap } = props;
  const map = useMap();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();

  const {
    routeGroups,
    selectedSegmentIndex,
    incidencias,
    selectedIncidenciaId,
    isIncidenciasSheetOpen,
    historyVehicle,
  } = state;

  // Load Maps libraries
  useEffect(() => {
    if (!map) return;
    
    const loadLibraries = async () => {
      try {
        await Promise.all([
          google.maps.importLibrary('geometry'),
          google.maps.importLibrary('marker')
        ]);
      } catch (e) {
        console.warn('Google Maps libraries failed to load.', e);
      }
    };
    
    loadLibraries();
  }, [map]);

  // Hook to handle all map viewport logic (pan, zoom, bounds) for Google
  useMapViewport({
    map,
    provider: 'google',
    ...props
  });

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, miniMapId, manualVehicleIds, isMainMap), 
    [state, miniMapId, manualVehicleIds, isMainMap]
  );

  const halfIndex = Math.ceil(routeGroups.length / 2);
  const displayGroups = side === 'ida' 
    ? routeGroups.slice(0, halfIndex) 
    : side === 'vuelta' 
      ? routeGroups.slice(halfIndex) 
      : routeGroups;

  const firstRecord = displayGroups?.[0]?.records?.[0];
  const lastGroup = displayGroups?.[displayGroups.length - 1];
  const lastRecord = lastGroup?.records?.[lastGroup.records.length - 1];

  if (!map) return null;

  return (
    <>
      {mapVehicles.map((vehicle, index) => (
        <AnimatedVehicleMarker
          key={vehicle.id_vehiculo}
          vehicle={vehicle}
          index={index}
        />
      ))}

      <RouteSegments side={side} isMainMap={isMainMap} />
      
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
