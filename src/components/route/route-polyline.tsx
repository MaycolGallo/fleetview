
"use client";

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef, useMemo } from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { EventMarker } from '@/components/event-marker';

function catmullRomSpline(
    points: { lat: number; lng: number }[],
    pointsPerSegment: number = 10
): { lat: number; lng: number }[] {
    if (points.length < 2) {
        return points;
    }

    const result: { lat: number; lng: number }[] = [];

    result.push(points[0]);

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : points[i+1];

        for (let j = 1; j <= pointsPerSegment; j++) {
            const t = j / pointsPerSegment;
            const t2 = t * t;
            const t3 = t2 * t;

            const lat = 0.5 * (
                (2 * p1.lat) +
                (-p0.lat + p2.lat) * t +
                (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 +
                (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3
            );

            const lng = 0.5 * (
                (2 * p1.lng) +
                (-p0.lng + p2.lng) * t +
                (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t2 +
                (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3
            );
            
            result.push({ lat, lng });
        }
    }
    
    return result;
}

interface RouteSegmentsProps {
    side?: 'ida' | 'vuelta';
}

export function RouteSegments({ side }: RouteSegmentsProps) {
    const map = useMap();
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const { routeGroups, selectedSegmentIndex, incidencias, isIncidenciasSheetOpen, masterRoute, historyVehicle } = state;
    const polylinesRef = useRef<google.maps.Polyline[]>([]);
  
    // Determine the segments to display based on whether we are in history or fleet mode
    const halfIndex = Math.ceil(routeGroups.length / 2);
    const displayGroups = side === 'ida' 
      ? routeGroups.slice(0, halfIndex) 
      : side === 'vuelta' 
        ? routeGroups.slice(halfIndex) 
        : routeGroups;

    // Fleet Master Route logic
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
        const sortedIncidencias = [...incidencias].sort((a, b) => a.timestamp - b.timestamp);
        return sortedIncidencias.map(inc => ({ lat: inc.lat, lng: inc.lng }));
    }, [incidencias, isIncidenciasSheetOpen]);

    useEffect(() => {
        polylinesRef.current.forEach(p => {
            google.maps.event.clearInstanceListeners(p);
            p.setMap(null);
        });
        polylinesRef.current = [];

        if (!map) return;

        const newPolylines: google.maps.Polyline[] = [];

        // Scenario 1: Draw route groups from Route History
        if (historyVehicle && !isIncidenciasSheetOpen) {
            displayGroups.forEach((group, index) => {
                if (group.id_estado === 6) {
                    const isSelected = selectedSegmentIndex === index;
                    const rawPath = group.records.map(r => ({ lat: r.lat, lng: r.lng }));
                    const path = catmullRomSpline(rawPath);
                    
                    const handleSegmentClick = () => {
                        dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: index });
                    };

                    const polylineColor = isSelected ? '#f59e0b' : group.color;

                    const polyline = new google.maps.Polyline({
                        path: path,
                        strokeColor: polylineColor,
                        strokeOpacity: 0.8,
                        strokeWeight: isSelected ? 8 : 6,
                        map: map,
                        zIndex: isSelected ? 4 : 2,
                        clickable: true,
                        icons: [{
                            icon: {
                                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                scale: 3,
                                strokeColor: polylineColor,
                                fillColor: polylineColor,
                                fillOpacity: 1,
                            },
                            offset: '0',
                            repeat: '75px'
                        }],
                    });
                    
                    polyline.addListener('click', handleSegmentClick);
                    newPolylines.push(polyline);
                }
            });
        } 
        // Scenario 2: Draw Fleet Master Route (Outbound/Inbound legs)
        else if (fleetRoutePoints) {
            const path = catmullRomSpline(fleetRoutePoints, 15);
            const color = side === 'vuelta' ? '#3B82F6' : '#22C55E'; // Blue for return, Green for outbound
            
            const polyline = new google.maps.Polyline({
                path: path,
                strokeColor: color,
                strokeOpacity: 0.4,
                strokeWeight: 5,
                map: map,
                zIndex: 1,
                icons: [{
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 2,
                        strokeColor: color,
                        fillColor: color,
                        fillOpacity: 1,
                    },
                    offset: '0',
                    repeat: '100px'
                }],
            });
            newPolylines.push(polyline);
        }
        // Scenario 3: Draw simple path through Incidencias
        else if (incidenciasPath) {
            const polyline = new google.maps.Polyline({
                path: incidenciasPath,
                strokeColor: '#EF4444',
                strokeOpacity: 0.6,
                strokeWeight: 4,
                map: map,
                zIndex: 2,
                icons: [{
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 2,
                        strokeColor: '#EF4444',
                        fillColor: '#EF4444',
                        fillOpacity: 1,
                    },
                    offset: '0',
                    repeat: '50px'
                }],
            });
            newPolylines.push(polyline);
        }

        polylinesRef.current = newPolylines;
  
        return () => {
            newPolylines.forEach(p => {
                google.maps.event.clearInstanceListeners(p);
                p.setMap(null);
            });
        };
    }, [map, displayGroups, selectedSegmentIndex, dispatch, isIncidenciasSheetOpen, incidenciasPath, fleetRoutePoints, side, historyVehicle]);
  
    return (
        <>
            {historyVehicle && !isIncidenciasSheetOpen && displayGroups.map((group, index) => {
                if ((group.id_estado === 4 || group.id_estado === 5) && selectedSegmentIndex === null) {
                    const firstRecord = group.records[0];
                    if (!firstRecord) return null;
                    
                    return (
                        <EventMarker
                            key={`event-${index}`}
                            position={{ lat: firstRecord.lat, lng: firstRecord.lng }}
                            duration={group.total_time_seconds / 60}
                            status={group.id_estado}
                            color={group.color}
                        />
                    );
                }
                return null;
            })}
        </>
    );
}
