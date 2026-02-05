"use client";

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';
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
                (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t3
            );
            
            result.push({ lat, lng });
        }
    }
    
    return result;
}

export function RouteSegments() {
    const map = useMap();
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const { routeGroups, selectedSegmentIndex } = state;
    const polylinesRef = useRef<google.maps.Polyline[]>([]);
  
    useEffect(() => {
        // Clean up previous polylines
        polylinesRef.current.forEach(p => {
            google.maps.event.clearInstanceListeners(p);
            p.setMap(null);
        });
        polylinesRef.current = [];

        if (!map || routeGroups.length === 0) return;

        const newPolylines: google.maps.Polyline[] = [];

        routeGroups.forEach((group, index) => {
            if (group.id_estado === 6) { // MOVING / Transitando
                const isSelected = selectedSegmentIndex === index;
                
                const rawPath = group.records.map(r => ({ lat: r.lat, lng: r.lng }));
                const path = catmullRomSpline(rawPath);
                
                const handleSegmentClick = () => {
                    dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: index });
                };

                const polylineColor = isSelected ? '#f59e0b' : group.color;

                const arrowIcon = {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    strokeOpacity: 1,
                    scale: 3,
                    strokeColor: polylineColor,
                    strokeWeight: 1,
                    fillColor: polylineColor,
                    fillOpacity: 1,
                };
  
                const polyline = new google.maps.Polyline({
                    path: path,
                    strokeColor: polylineColor,
                    strokeOpacity: 0.8,
                    strokeWeight: isSelected ? 8 : 6,
                    map: map,
                    zIndex: isSelected ? 4 : 2,
                    clickable: true,
                    icons: [{
                        icon: arrowIcon,
                        offset: '0',
                        repeat: '75px'
                    }],
                });
                
                polyline.addListener('click', handleSegmentClick);
                newPolylines.push(polyline);
            }
        });

        polylinesRef.current = newPolylines;
  
        // Cleanup function for this effect
        return () => {
            newPolylines.forEach(p => {
                google.maps.event.clearInstanceListeners(p);
                p.setMap(null);
            });
        };
    }, [map, routeGroups, selectedSegmentIndex, dispatch]);
  
    // Render non-polyline markers declaratively
    return (
        <>
            {routeGroups.map((group, index) => {
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
