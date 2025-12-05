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
}

function RoutePolyline({ routePath }: { routePath: { lat: number; lng: number }[] }) {
  const map = useMap();
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    // Define the arrow icon for the polyline
    const arrowIcon = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 3,
      strokeColor: '#FFC107',
    };

    if (routePath && routePath.length > 0) {
      if (polyline) {
        polyline.setPath(routePath);
      } else {
        const newPolyline = new google.maps.Polyline({
          path: routePath,
          strokeColor: "#FFC107",
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map: map,
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
  }, [map, routePath, polyline]);

  useEffect(() => {
    // Cleanup polyline when component unmounts
    return () => {
        if (polyline) {
            polyline.setMap(null);
        }
    }
  },[polyline]);

  return null;
}


export function FleetMap({ apiKey, vehicles, onVehicleSelect, selectedVehicle, routePath }: FleetMapProps) {
  const defaultCenter = { lat: -12.046374, lng: -77.042793 };
  const defaultZoom = 13;

  const mapCenter = selectedVehicle && routePath ? { lat: selectedVehicle.latitude, lng: selectedVehicle.longitude } : defaultCenter;
  const mapZoom = selectedVehicle && routePath ? 14 : defaultZoom;


  return (
    <APIProvider apiKey={apiKey}>
      <Map
        center={mapCenter}
        zoom={mapZoom}
        gestureHandling={'greedy'}
        mapId="fleetview-map"
        className="w-full h-full"
      >
        {vehicles.map((vehicle) => (
          <AdvancedMarker
            key={vehicle.vehicleId}
            position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
            onClick={() => onVehicleSelect(vehicle)}
          >
            <VehiclePin status={vehicle.status} isSelected={selectedVehicle?.vehicleId === vehicle.vehicleId} />
          </AdvancedMarker>
        ))}
         {routePath && <RoutePolyline routePath={routePath} />}
      </Map>
    </APIProvider>
  );
}
