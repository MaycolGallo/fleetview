

"use client";

import { APIProvider, Map, useMap, ColorScheme } from '@vis.gl/react-google-maps';
import type { Vehicle } from '@/lib/types';
import React, { useEffect, useMemo, useRef } from 'react';
import { AnimatedVehicleMarker } from './vehicle-marker';
import { useFleet } from '@/context/fleet-context';

interface FleetMapProps {
  apiKey: string;
}

function RoutePolyline({ 
  routePath, 
  color, 
  weight, 
  zIndex = 1,
  onClick
}: { 
  routePath: { lat: number; lng: number }[] | null, 
  color: string, 
  weight: number, 
  zIndex?: number,
  onClick?: (pointIndex: number) => void 
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
        strokeColor: zIndex === 1 ? '#FFFFFF' : color,
        strokeWeight: 1,
        fillColor: zIndex === 1 ? '#FFFFFF' : color,
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
        icons: zIndex === 1 ? [{ // Only show arrows on the main route line
          icon: arrowIcon,
          offset: '0',
          repeat: '50px'
        }] : undefined,
      });
      polylineRef.current = newPolyline;

      if (onClick) {
        newPolyline.addListener('click', (e: google.maps.PolyMouseEvent) => {
          if (!e.latLng || !routePath) return;

          // Find the closest point on the polyline to the click event
          let closestPointIndex = -1;
          let minDistance = Infinity;

          routePath.forEach((point, index) => {
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
              e.latLng!,
              new google.maps.LatLng(point.lat, point.lng)
            );
            if (distance < minDistance) {
              minDistance = distance;
              closestPointIndex = index;
            }
          });

          if (closestPointIndex !== -1) {
            onClick(closestPointIndex);
          }
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
  }, [map, routePath, color, weight, zIndex, onClick]);

  return null;
}

function MapControl() {
  const map = useMap();
  const { state, dispatch } = useFleet();

  const {
    vehicles,
    statusFilter,
    routeHistoryVehicle,
    mapViewport,
    visibleVehicleIds,
    highlightedSegment,
    routePath
  } = state;

  const handleRouteClick = (pointIndex: number) => {
    dispatch({ type: 'SELECT_MAP_SEGMENT', payload: pointIndex });
  };

  useEffect(() => {
    // Load the geometry library when the map is available
    if (map) {
      google.maps.importLibrary('geometry');
      google.maps.importLibrary('marker');
    }
  }, [map]);


  useEffect(() => {
    if (!map) return;

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
    }
  }, [map, mapViewport]);

  const filteredVehicles = useMemo(() => {
    if (routeHistoryVehicle) {
      return [routeHistoryVehicle];
    }
    return vehicles.filter(v => 
      visibleVehicleIds.has(v.id) &&
      (statusFilter === 'all' || v.status === statusFilter)
    );
  }, [vehicles, statusFilter, routeHistoryVehicle, visibleVehicleIds]);

  return (
    <>
        {filteredVehicles.map((vehicle) => (
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


export function FleetMap({ apiKey }: FleetMapProps) {
  const { state, dispatch } = useFleet();
  const { isMapDark } = state;
  
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.domEvent.target instanceof HTMLElement && e.domEvent.target.closest('[data-vehicle-id]')) {
      return;
    }
    dispatch({ type: 'PAN_TO_VEHICLE', payload: null });
  };

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full">
        <Map 
            defaultCenter={{ lat: -12.046374, lng: -77.042793 }}
            defaultZoom={13}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={'a3b0c4d2e9f3g4h5'}
            onClick={handleMapClick}
            colorScheme={isMapDark ? ColorScheme.DARK : ColorScheme.LIGHT}
        >
          <MapControl />
        </Map>
      </div>
    </APIProvider>
  );
}
