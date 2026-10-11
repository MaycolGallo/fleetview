'use client';

/**
 * @fileOverview Tactical Polyline Engine for Leaflet.
 * Manages Historical paths, Baseline references, and Incident timelines.
 */

import React, { Fragment, useMemo } from 'react';
import { Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import L from 'leaflet';

interface LeafletRoutePolylinesProps {
  side?: 'ida' | 'vuelta';
}

/**
 * Renders all tactical polyline layers for Leaflet (History, Despacho Base Route, Incidents).
 * Optimized with reactive selection patterns to ensure instant styling updates.
 */
export function LeafletRoutePolylines({ side }: LeafletRoutePolylinesProps) {
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();
  const { 
    routeGroups, 
    incidencias, 
    isIncidenciasSheetOpen, 
    historyVehicle, 
    despachoBaseRoute,
    selectedSegmentIndex,
    isRoutePlaying,
    playbackIndex
  } = state;

  const despachoRoutePoints = useMemo(() => {
      if (!side || historyVehicle || isIncidenciasSheetOpen) return null;
      if (!despachoBaseRoute || despachoBaseRoute.length === 0) return null;
      
      const halfMaster = Math.ceil(despachoBaseRoute.length / 2);
      return side === 'ida' ? despachoBaseRoute.slice(0, halfMaster) : despachoBaseRoute.slice(halfMaster - 1);
  }, [despachoBaseRoute, historyVehicle, isIncidenciasSheetOpen, side]);

  return (
    <>
        {/* Scenario 1: Historical Path & Stops */}
        {historyVehicle && !isIncidenciasSheetOpen && routeGroups && routeGroups.map((group, idx) => {
           const isSelected = selectedSegmentIndex === idx;

           // 1. Moving Segments: Interactive Polylines
           if (group.id_estado === 6) {
             let points = group.records.map(r => [r.lat, r.lng] as [number, number]);
             
             // When route is playing, only show polyline up to current playback position
             if (isRoutePlaying) {
               // Calculate which points to show based on playbackIndex
               const startIndexInGroup = routeGroups
                 .slice(0, idx)
                 .filter(g => g.id_estado === 6)
                 .reduce((sum, g) => sum + g.records.length, 0);
               
               const endIndexInGroup = Math.min(
                 Math.max(0, playbackIndex + 1 - startIndexInGroup),
                 group.records.length
               );
               
               // Only show this group's polyline if we've reached it
               if (endIndexInGroup > 0) {
                 points = points.slice(0, endIndexInGroup);
               } else {
                 return null; // Haven't reached this group yet
               }
             }
             
             // Don't render empty polylines
             if (points.length === 0) return null;
             
             // Tactical Highlight: Amber for selection, Group Color for standard
             const color = isSelected ? '#f59e0b' : group.color;
             const weight = isSelected ? 10 : 6;
             
             return (
              <Fragment key={`hist-segment-${idx}-${isSelected}-${playbackIndex}`}>
                <Polyline
                key={`hist-line-${idx}-${isSelected}-${playbackIndex}`}
                positions={points} 
                color={color} 
                weight={weight} 
                opacity={0.9}
                lineCap="round"
                lineJoin="round"
                eventHandlers={{
                  click: (e: any) => {
                    try {
                      L.DomEvent.stopPropagation(e);
                    } catch (err) {
                      // Leaflet event already handled
                    }
                    dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: idx });
                  }
                }}
                />
                {points.map((point, pointIndex) => {
                  const record = group.records[pointIndex];
                  if (!record) return null;
                  return (
                    <CircleMarker
                      key={`hist-point-${idx}-${pointIndex}-${isSelected}`}
                      center={point}
                      radius={3}
                      pathOptions={{ color: group.color, fillColor: group.color, fillOpacity: 0.95, weight: 1 }}
                    >
                      <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                        <div className="space-y-0.5 text-xs">
                          <div><strong>Fecha:</strong> {new Date(record.fecha * 1000).toLocaleString()}</div>
                          <div><strong>Velocidad:</strong> {record.velocidad || '0'} km/h</div>
                          <div><strong>Coordenadas:</strong> {record.lat.toFixed(6)}, {record.lng.toFixed(6)}</div>
                        </div>
                      </Tooltip>
                    </CircleMarker>
                  );
                })}
              </Fragment>
            );
           }

           // 2. Stops/Idle Points: Interactive Markers
           const isStop = group.id_estado === 4 || group.id_estado === 5;
           if (isStop) {
             const first = group.records[0];
             if (!first) return null;
             
             return (
                <CircleMarker 
                  key={`hist-stop-${idx}-${isSelected}`}
                  center={[first.lat, first.lng]} 
                  radius={isSelected ? 10 : 8} 
                  pathOptions={{ 
                    fillColor: isSelected ? '#f59e0b' : group.color, 
                    color: isSelected ? 'white' : 'white', 
                    weight: isSelected ? 4 : 2, 
                    fillOpacity: 1 
                  }}
                  eventHandlers={{
                    click: (e) => {
                        L.DomEvent.stopPropagation(e);
                        dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: idx });
                    }
                  }}
                />
             );
           }
           
           return null;
        })}

        {/* Scenario 2: Despacho Base Route Reference */}
        {despachoRoutePoints && (
          <Polyline 
            positions={despachoRoutePoints.map(p => [p.lat, p.lng] as [number, number])}
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
