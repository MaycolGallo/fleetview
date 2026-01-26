
"use client";

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';
import { useFleetState, useFleetDispatch } from '@/context/fleet-context';
import { EventMarker } from './event-marker';

export function RoutePolyline({
  routePath,
  color,
  weight,
  zIndex = 1,
  onClick,
  showArrows = false,
}: {
  routePath: { lat: number; lng: number }[] | null,
  color: string,
  weight: number,
  zIndex?: number,
  onClick?: () => void,
  showArrows?: boolean,
}) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (map && routePath && routePath.length > 0) {
      const arrowIcon = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        strokeOpacity: 1,
        scale: 3,
        strokeColor: color,
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: 1,
      };

      const newPolyline = new google.maps.Polyline({
        path: routePath,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: weight,
        map: map,
        zIndex: zIndex,
        clickable: !!onClick,
        icons: showArrows ? [{
          icon: arrowIcon,
          offset: '0',
          repeat: '75px'
        }] : undefined,
      });
      polylineRef.current = newPolyline;

      if (onClick) {
        newPolyline.addListener('click', () => {
          onClick();
        });
      }

    } else {
        polylineRef.current = null;
    }

    return () => {
      if (polylineRef.current) {
        google.maps.event.clearInstanceListeners(polylineRef.current);
        polylineRef.current.setMap(null);
      }
    };
  }, [map, routePath, color, weight, zIndex, onClick, showArrows]);

  return null;
}


export function RouteSegments() {
    const { state } = useFleetState();
    const dispatch = useFleetDispatch();
    const { routeGroups, selectedSegmentIndex } = state;
  
    return (
        <>
            {routeGroups.map((group, index) => {
                const isSelected = selectedSegmentIndex === index;
                
                if (group.id_estado === 6) { // MOVING / Transitando
                    const path = group.records.map(r => {
                        const [lat, lng] = r.coordenadas.split(',').map(Number);
                        return { lat, lng };
                    });
                    
                    const handleSegmentClick = () => {
                        dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: index });
                    };

                    return (
                        <RoutePolyline
                            key={`segment-${index}`}
                            routePath={path}
                            color={isSelected ? '#f59e0b' : group.color}
                            weight={isSelected ? 8 : 6}
                            zIndex={isSelected ? 4 : 2}
                            onClick={handleSegmentClick}
                            showArrows={true}
                        />
                    );
                } else if ((group.id_estado === 4 || group.id_estado === 5) && selectedSegmentIndex === null) {
                    // IDLE / Ralenti or PARKED / Estacionado, show event marker only when no segment is selected
                    return (
                        <EventMarker
                            key={`event-${index}`}
                            position={group.startPoint}
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
