'use client';

import React, { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { useFleetDispatch, useFleetState } from '@/context/fleet-context';
import { catmullRomSpline } from './leaflet-map-helpers';
import { LeafletEventMarker } from './leaflet-map-markers';

interface LeafletRouteSegmentsProps {
  side?: 'ida' | 'vuelta';
}

export function LeafletRouteSegments({ side }: LeafletRouteSegmentsProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { routeGroups, selectedSegmentIndex, incidencias, isIncidenciasSheetOpen, masterRoute, historyVehicle } = state;

  const halfIndex = Math.ceil(routeGroups.length / 2);
  const displayGroups = side === 'ida'
    ? routeGroups.slice(0, halfIndex)
    : side === 'vuelta'
      ? routeGroups.slice(halfIndex)
      : routeGroups;

  const fleetRoutePoints = useMemo(() => {
    if (historyVehicle || isIncidenciasSheetOpen) return null;
    if (!masterRoute || masterRoute.length === 0) return null;
    const halfMaster = Math.ceil(masterRoute.length / 2);
    if (side === 'ida') return masterRoute.slice(0, halfMaster);
    if (side === 'vuelta') return masterRoute.slice(halfMaster - 1);
    return masterRoute;
  }, [masterRoute, historyVehicle, isIncidenciasSheetOpen, side]);

  const incidenciasPath = useMemo(() => {
    if (!isIncidenciasSheetOpen || incidencias.length < 2) return null;
    const sorted = [...incidencias].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map((inc) => ({ lat: inc.lat, lng: inc.lng }));
  }, [incidencias, isIncidenciasSheetOpen]);

  return (
    <>
      {historyVehicle && !isIncidenciasSheetOpen && displayGroups.map((group, index) => {
        if (group.id_estado !== 6) return null;
        const isSelected = selectedSegmentIndex === index;
        const rawPath = group.records.map((record) => ({ lat: record.lat, lng: record.lng }));
        const path = catmullRomSpline(rawPath);
        const polylineColor = isSelected ? '#f59e0b' : group.color;

        return (
          <Polyline
            key={`route-${index}`}
            positions={path.map((point) => [point.lat, point.lng] as [number, number])}
            pathOptions={{ color: polylineColor, weight: isSelected ? 8 : 6, opacity: 0.85 }}
            eventHandlers={{ click: () => dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: index }) }}
          />
        );
      })}

      {fleetRoutePoints && (
        <Polyline
          positions={catmullRomSpline(fleetRoutePoints, 15).map((point) => [point.lat, point.lng] as [number, number])}
          pathOptions={{ color: side === 'vuelta' ? '#3B82F6' : '#22C55E', weight: 5, opacity: 0.45 }}
        />
      )}

      {incidenciasPath && (
        <Polyline
          positions={incidenciasPath.map((point) => [point.lat, point.lng] as [number, number])}
          pathOptions={{ color: '#EF4444', weight: 4, opacity: 0.7 }}
        />
      )}

      {historyVehicle && !isIncidenciasSheetOpen && displayGroups.map((group, index) => {
        if ((group.id_estado === 4 || group.id_estado === 5) && selectedSegmentIndex === null) {
          const firstRecord = group.records[0];
          if (!firstRecord) return null;
          return (
            <LeafletEventMarker
              key={`event-${index}`}
              position={{ lat: firstRecord.lat, lng: firstRecord.lng }}
              color={group.color}
            />
          );
        }
        return null;
      })}
    </>
  );
}
