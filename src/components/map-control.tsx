
"use client";

import { useMap } from '@vis.gl/react-google-maps';
import React, { useEffect, useMemo } from 'react';
import { useFleet, selectMapVehicles } from '@/context/fleet-context';
import { AnimatedVehicleMarker } from './animated-vehicle-marker';
import { RoutePolyline } from './route-polyline';

export function MapControl() {
  const map = useMap();
  const { state, dispatch } = useFleet();

  const {
    mapViewport,
    highlightedSegment,
    routePath
  } = state;

  const handleRouteClick = (pointIndex: number) => {
    dispatch({ type: 'SELECT_MAP_SEGMENT', payload: pointIndex });
  };

  useEffect(() => {
    if (!map) return;

    // Load the geometry library when the map is available
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
    // After the viewport action is handled, dispatch an action to signify completion.
    // This prevents the action from being re-triggered on subsequent renders.
    dispatch({ type: 'VIEWPORT_ACTION_COMPLETE' });

  }, [map, mapViewport, dispatch]);

  const mapVehicles = useMemo(() => selectMapVehicles(state), [state.historyVehicle, state.vehicles, state.statusFilter, state.visibleVehicleIds]);

  return (
    <>
        {mapVehicles.map((vehicle) => (
            <AnimatedVehicleMarker
              key={vehicle.id}
              vehicle={vehicle}
            />
        ))}

      <RoutePolyline routePath={routePath} color="#16a34a" weight={5} zIndex={1} onClick={handleRouteClick} />
      <RoutePolyline routePath={highlightedSegment} color="#f59e0b" weight={7} zIndex={2} />
    </>
  );
}
