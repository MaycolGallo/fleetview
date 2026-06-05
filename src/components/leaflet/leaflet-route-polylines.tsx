'use client';

import React, { useMemo } from 'react';
import { Polyline, CircleMarker } from 'react-leaflet';
import { useFleetState } from '@/context/fleet-context';

interface LeafletRoutePolylinesProps {
  side?: 'ida' | 'vuelta';
}

/**
 * Renders all tactical polyline layers for Leaflet (History, Master Route, Incidents).
 */
export function LeafletRoutePolylines({ side }: LeafletRoutePolylinesProps) {
  const { state } = useFleetState();
  const { routeGroups, incidencias, isIncidenciasSheetOpen, historyVehicle, masterRoute } = state;

  const fleetRoutePoints = useMemo(() => {
      if (!side || historyVehicle || isIncidenciasSheetOpen) return null;
      if (!masterRoute || masterRoute.length === 0) return null;
      
      const halfMaster = Math.ceil(masterRoute.length / 2);
      if (side === 'ida') return masterRoute.slice(0, halfMaster);
      if (side === 'vuelta') return masterRoute.slice(halfMaster - 1);
      return null;
  }, [masterRoute, historyVehicle, isIncidenciasSheetOpen, side]);

  return (
    <>
        {/* Scenario 1: Historical Path & Stops */}
        {historyVehicle && !isIncidenciasSheetOpen && routeGroups.map((group, idx) => {
           if (group.id_estado === 6) {
             const points = group.records.map(r => [r.lat, r.lng] as [number, number]);
             return (
              <Polyline 
                key={`hist-${idx}`} 
                positions={points} 
                color={group.color} 
                weight={6} 
                opacity={0.8} 
              />
            );
           }
           if (group.id_estado === 4 || group.id_estado === 5) {
             const first = group.records[0];
             return (
                <CircleMarker 
                  key={`stop-${idx}`} 
                  center={[first.lat, first.lng]} 
                  radius={8} 
                  pathOptions={{ fillColor: group.color, color: 'white', weight: 2, fillOpacity: 1 }}
                />
             );
           }
           return null;
        })}

        {/* Scenario 2: Master Fleet Route (Split View) */}
        {fleetRoutePoints && (
          <Polyline 
            positions={fleetRoutePoints.map(p => [p.lat, p.lng] as [number, number])}
            color={side === 'vuelta' ? '#3B82F6' : '#22C55E'}
            weight={5}
            opacity={0.4}
            dashArray="10, 10"
          />
        )}

        {/* Scenario 3: Incident Timeline Path */}
        {isIncidenciasSheetOpen && incidencias.length > 1 && (
           <Polyline 
             positions={incidencias.map(i => [i.lat, i.lng] as [number, number])} 
             color="#EF4444" 
             weight={4} 
             dashArray="5, 10"
             opacity={0.6}
           />
        )}
    </>
  );
}
