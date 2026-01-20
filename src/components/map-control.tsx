
"use client";

import { useMap } from '@vis.gl/react-google-maps';
import React, { useEffect, useMemo } from 'react';
import { useFleetState, useFleetDispatch, selectMapVehicles } from '@/context/fleet-context';
import { AnimatedVehicleMarker } from './animated-vehicle-marker';
import { RoutePolyline } from './route-polyline';
import { EventMarker } from './event-marker';

export function MapControl() {
  const map = useMap();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();

  const {
    mapViewport,
    highlightedSegment,
    routePath,
    routeSegments,
    selectedSegmentIndex,
  } = state;

  const handleSegmentClick = (segmentIndex: number) => {
    dispatch({ type: 'SELECT_ROUTE_SEGMENT', payload: segmentIndex });
  };

  useEffect(() => {
    if (!map) return;
    google.maps.importLibrary('geometry');
    google.maps.importLibrary('marker');
  }, [map]);


  useEffect(() => {
    if (!map || mapViewport.type === 'idle' || mapViewport.type === 'initial') {
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

  }, [map, mapViewport, dispatch]);

  const mapVehicles = useMemo(() => selectMapVehicles(state), [state]);

  return (
    <>
        {mapVehicles.map((vehicle) => (
            <AnimatedVehicleMarker
              key={vehicle.id}
              vehicle={vehicle}
            />
        ))}

      {routePath && routePath.map((path, index) => {
          const movingSegments = routeSegments.map((seg, i) => ({...seg, originalIndex: i})).filter(seg => seg.id_estado === '6');
          const originalIndex = movingSegments[index]?.originalIndex;
          
          if (originalIndex === undefined || originalIndex === selectedSegmentIndex) {
              return null;
          }

          return (
            <RoutePolyline 
              key={`main-route-${originalIndex}`} 
              routePath={path} 
              color="#16a34a" 
              weight={5} 
              zIndex={1} 
              onClick={() => handleSegmentClick(originalIndex)}
              showArrows={true} 
            />
          );
      })}
      
      <RoutePolyline
        routePath={highlightedSegment}
        color="#f59e0b"
        weight={7}
        zIndex={2}
        showArrows={true}
        onClick={selectedSegmentIndex !== null ? () => handleSegmentClick(selectedSegmentIndex) : undefined}
      />

      {selectedSegmentIndex === null && routeSegments.map((segment, index) => {
        if (segment.id_estado === '4' || segment.id_estado === '5') {
          return (
            <EventMarker
              key={`event-${index}`}
              position={segment.startPoint}
              duration={segment.durationMinutes}
              status={segment.id_estado}
            />
          );
        }
        return null;
      })}
    </>
  );
}
