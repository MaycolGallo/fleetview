
"use client";

import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import type { Vehicle } from '@/lib/types';
import { VehiclePin } from './vehicle-pin';
import { useEffect, useState } from 'react';

interface FleetMapProps {
  apiKey: string;
  vehicles: Vehicle[];
  onVehicleSelect: (vehicle: Vehicle) => void;
  selectedVehicle: Vehicle | null;
  routePath: { lat: number; lng: number }[] | null;
  highlightedSegment: { lat: number; lng: number }[] | null;
  routeSegmentToFit: { lat: number; lng: number }[] | null;
}

function RoutePolyline({ routePath, color, weight, zIndex = 1 }: { routePath: { lat: number; lng: number }[], color: string, weight: number, zIndex?: number }) {
  const map = useMap();
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    const arrowIcon = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 3,
      strokeColor: color,
    };

    if (routePath && routePath.length > 0) {
      if (polyline) {
        polyline.setPath(routePath);
        polyline.setOptions({
            strokeColor: color,
            strokeWeight: weight,
            zIndex: zIndex,
            icons: [{
                icon: arrowIcon,
                offset: '0',
                repeat: '50px'
            }],
        })
      } else {
        const newPolyline = new google.maps.Polyline({
          path: routePath,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: weight,
          map: map,
          zIndex: zIndex,
          icons: [{
            icon: arrowIcon,
            offset: '0',
            repeat: '50px'
          }],
        });
        setPolyline(newPolyline);
      }
    } else {
      if (polyline) {
        polyline.setMap(null);
        setPolyline(null);
      }
    }
    
    // Cleanup effect
    return () => {
      if (polyline) {
        polyline.setMap(null);
      }
    };
  // To avoid re-rendering issues, we stringify the path as a dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(routePath), color, weight, zIndex]);

  return null;
}

// This new component will contain the logic that needs the map instance.
function MapControl({ 
  vehicles, 
  onVehicleSelect, 
  selectedVehicle, 
  routePath, 
  highlightedSegment,
  routeSegmentToFit 
}: Omit<FleetMapProps, 'apiKey'>) {
  const map = useMap();

  useEffect(() => {
    if (map && routeSegmentToFit && routeSegmentToFit.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      routeSegmentToFit.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, 100);
    }
  }, [map, routeSegmentToFit]);
  
  return (
    <>
      {vehicles.map((vehicle) => (
        <AdvancedMarker
          key={vehicle.vehicleId}
          position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
          onClick={() => onVehicleSelect(vehicle)}
        >
          <VehiclePin status={vehicle.status} isSelected={selectedVehicle?.vehicleId === vehicle.vehicleId} />
        </AdvancedMarker>
      ))}
      {routePath && <RoutePolyline routePath={routePath} color="#FFC107" weight={4} zIndex={1} />}
      {highlightedSegment && <RoutePolyline routePath={highlightedSegment} color="#FFFFFF" weight={6} zIndex={2} />}
    </>
  );
}


export function FleetMap({ apiKey, vehicles, onVehicleSelect, selectedVehicle, routePath, highlightedSegment, routeSegmentToFit }: FleetMapProps) {
  const defaultCenter = { lat: -12.046374, lng: -77.042793 };
  const defaultZoom = 13;

  // Use a key to force re-render when we want to center on a new route
  const mapKey = selectedVehicle?.vehicleId && routePath ? selectedVehicle.vehicleId : 'default';
  const initialCenter = selectedVehicle && routePath ? { lat: selectedVehicle.latitude, lng: selectedVehicle.longitude } : defaultCenter;
  const initialZoom = selectedVehicle && routePath ? 14 : defaultZoom;


  return (
    <APIProvider apiKey={apiKey}>
      <Map
        key={mapKey}
        defaultCenter={initialCenter}
        defaultZoom={initialZoom}
        gestureHandling={'greedy'}
        mapId="fleetview-map"
        className="w-full h-full"
      >
        <MapControl 
          vehicles={vehicles}
          onVehicleSelect={onVehicleSelect}
          selectedVehicle={selectedVehicle}
          routePath={routePath}
          highlightedSegment={highlightedSegment}
          routeSegmentToFit={routeSegmentToFit}
        />
      </Map>
    </APIProvider>
  );
}
