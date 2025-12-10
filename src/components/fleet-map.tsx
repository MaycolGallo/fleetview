

"use client";

import { APIProvider, Map, useMap, ColorScheme, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Vehicle } from '@/lib/types';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VehicleMarker, type VehicleAction } from './vehicle-marker';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { XIcon } from 'lucide-react';
import { useFleet } from '@/context/fleet-context';

interface FleetMapProps {
  apiKey: string;
  onAction: (action: VehicleAction, vehicle: Vehicle) => void;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(routePath), color, weight, zIndex, onClick]);

  return null;
}

function MapControl({ onAction }: { onAction: (action: VehicleAction, vehicle: Vehicle) => void }) {
  const map = useMap();
  const { state, dispatch } = useFleet();
  const {
    vehicles,
    statusFilter,
    selectedVehicle,
    routeHistoryVehicle,
    routePath,
    highlightedSegment,
    routeSegmentToFit,
    isMapDark,
    visibleVehicleIds,
  } = state;
  const [infoVehicle, setInfoVehicle] = useState<Vehicle | null>(null);

  const handleVehicleSelect = (vehicle: Vehicle | null) => {
    dispatch({ type: 'SELECT_VEHICLE', payload: vehicle });
  };

  const handleRouteClick = (pointIndex: number) => {
    dispatch({ type: 'SELECT_MAP_SEGMENT', payload: pointIndex });
  };

  useEffect(() => {
    // Load the geometry library when the map is available
    if (map) {
      google.maps.importLibrary('geometry');
    }
  }, [map]);

  useEffect(() => {
    if (!map || !routeSegmentToFit || routeSegmentToFit.length === 0) return;
  
    if (routeSegmentToFit.length === 1) {
      map.panTo(routeSegmentToFit[0]);
      if (map.getZoom()! < 15) {
        map.setZoom(15);
      }
    } else {
      const bounds = new google.maps.LatLngBounds();
      routeSegmentToFit.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, 100);
    }
  }, [map, routeSegmentToFit]);
  
  const handleMapClick = () => {
    handleVehicleSelect(null);
    setInfoVehicle(null);
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    handleVehicleSelect(vehicle);
    setInfoVehicle(vehicle);
  }

  // When external selection changes (e.g. from list), close local info window
  useEffect(() => {
    setInfoVehicle(selectedVehicle);
  }, [selectedVehicle]);

  const filteredVehicles = useMemo(() => {
    if (routeHistoryVehicle) {
      return [routeHistoryVehicle];
    }
    return vehicles.filter(v => 
      visibleVehicleIds.has(v.vehicleId) &&
      (statusFilter === 'all' || v.status === statusFilter)
    );
  }, [vehicles, statusFilter, routeHistoryVehicle, visibleVehicleIds]);

  return (
    <>
    <Map 
        defaultCenter={{ lat: -12.046374, lng: -77.042793 }}
        defaultZoom={13}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId={'a3b0c4d2e9f3g4h5'}
        onClick={handleMapClick}
        colorScheme={isMapDark ? ColorScheme.DARK : ColorScheme.LIGHT}
    >
        {filteredVehicles.map((vehicle) => (
            <VehicleMarker
              key={vehicle.vehicleId}
              vehicle={vehicle}
              onVehicleSelect={() => handleVehicleClick(vehicle)}
              isSelected={selectedVehicle?.vehicleId === vehicle.vehicleId || infoVehicle?.vehicleId === vehicle.vehicleId}
              onAction={onAction}
            />
        ))}

        {infoVehicle && (
          <AdvancedMarker
            position={{ lat: infoVehicle.latitude, lng: infoVehicle.longitude }}
          >
            <div
              className="absolute bottom-[4rem] left-1/2 -translate-x-1/2 bg-popover text-popover-foreground rounded-lg shadow-lg p-3 w-64 border border-border"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{infoVehicle.vehicleId}</h4>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setInfoVehicle(null)}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className='space-y-2 text-sm'>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={
                    infoVehicle.status === 'active' ? 'default' :
                      infoVehicle.status === 'idle' ? 'secondary' : 'destructive'
                  } className="capitalize">
                    {infoVehicle.status.replace('-', ' ')}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coords:</span>
                  <span className='font-mono text-xs'>{infoVehicle.latitude.toFixed(4)}, {infoVehicle.longitude.toFixed(4)}</span>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={() => onAction('show-route-history', infoVehicle)}
              >
                Show Route History
              </Button>
            </div>
          </AdvancedMarker>
        )}

      <RoutePolyline routePath={routePath} color="#FFC107" weight={5} zIndex={1} onClick={handleRouteClick} />
      <RoutePolyline routePath={highlightedSegment} color="#FFFFFF" weight={7} zIndex={2} />
    </Map>
    </>
  );
}


export function FleetMap({ apiKey, onAction }: FleetMapProps) {
  
  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full">
        <MapControl 
          onAction={onAction}
        />
      </div>
    </APIProvider>
  );
}
