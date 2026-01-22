
"use client";

import { useMap } from '@vis.gl/react-google-maps';
import React, { useEffect, useMemo } from 'react';
import { useFleetState, useFleetDispatch, selectMapVehicles } from '@/context/fleet-context';
import { AnimatedVehicleMarker } from './animated-vehicle-marker';
import { RoutePolyline } from './route-polyline';
import { EventMarker } from './event-marker';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Flag, Play } from 'lucide-react';

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

  const fullMovingPath = useMemo(() => {
    if (!routePath) return null;
    return routePath.flat();
  }, [routePath]);

  console.log(routePath)

  return (
    <>
        {mapVehicles.map((vehicle) => (
            <AnimatedVehicleMarker
              key={vehicle.id}
              vehicle={vehicle}
            />
        ))}

      <RoutePolyline
        routePath={fullMovingPath}
        color="#16a34a"
        weight={5}
        zIndex={1}
        showArrows={true}
      />
      
      <RoutePolyline
        routePath={highlightedSegment}
        color="#f59e0b"
        weight={7}
        zIndex={2}
        showArrows={true}
      />

      {selectedSegmentIndex === null && routeSegments.map((segment, index) => {
        if ((segment.id_estado === '4' || segment.id_estado === '5') && segment.durationMinutes > 0) {
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

      {routeSegments.length > 0 && selectedSegmentIndex === null && (
        <>
            <AdvancedMarker
                position={routeSegments[0].startPoint}
                zIndex={1}
            >
                <div className="flex flex-col items-center">
                    <div className="bg-card/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-md mb-1 whitespace-nowrap">
                        Start
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
              position={routeSegments[routeSegments.length - 1].endPoint}
              zIndex={2}
            >
              <div className="flex flex-col items-center">
                <div className="bg-card/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-md mb-1 whitespace-nowrap">
                  Finish
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
    </>
  );
}
