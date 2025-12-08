
"use client";

import { APIProvider, Map, useMap, ColorScheme, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Vehicle } from '@/lib/types';
import React, { useEffect, useRef, useState } from 'react';
import { VehicleMarker } from './vehicle-marker';
import { Button } from './ui/button';
import { History } from 'lucide-react';

interface FleetMapProps {
  apiKey: string;
  vehicles: Vehicle[];
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onShowRouteHistory: (vehicle: Vehicle) => void;
  selectedVehicle: Vehicle | null; 
  routePath: { lat: number; lng: number }[] | null;
  highlightedSegment: { lat: number; lng: number }[] | null;
  routeSegmentToFit: { lat: number; lng: number }[] | null;
  isMapDark: boolean;
}

function RoutePolyline({ routePath, color, weight, zIndex = 1 }: { routePath: { lat: number; lng: number }[] | null, color: string, weight: number, zIndex?: number }) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (map && routePath && routePath.length > 0) {
      const arrowIcon = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 3,
        strokeColor: color,
      };

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
      polylineRef.current = newPolyline;
    } else {
        polylineRef.current = null;
    }
  
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(routePath), color, weight, zIndex]);

  return null;
}


// This component contains the logic that needs the map instance.
function MapControl({ 
  vehicles, 
  routePath, 
  highlightedSegment,
  routeSegmentToFit,
  onVehicleSelect,
  onShowRouteHistory,
  externalSelectedVehicle
}: {
  vehicles: Vehicle[];
  routePath: { lat: number; lng: number }[] | null;
  highlightedSegment: { lat: number; lng: number }[] | null;
  routeSegmentToFit: { lat: number; lng: number }[] | null;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onShowRouteHistory: (vehicle: Vehicle) => void;
  externalSelectedVehicle: Vehicle | null;
}) {
  const map = useMap();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Sync with external state if it changes (e.g., from list selection)
  useEffect(() => {
    setSelectedVehicle(externalSelectedVehicle);
  }, [externalSelectedVehicle]);

  
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

  const handleMarkerClick = (vehicle: Vehicle) => {
    if (selectedVehicle?.vehicleId === vehicle.vehicleId) {
      // If clicking the same marker, deselect it
      setSelectedVehicle(null);
      onVehicleSelect(null);
    } else {
      setSelectedVehicle(vehicle);
      onVehicleSelect(vehicle); // Notify parent
    }
  };

  const handleMapClick = () => {
    setSelectedVehicle(null);
    onVehicleSelect(null);
  };

  return (
    <>
       <Map onClick={handleMapClick}>
        {vehicles.map((vehicle) => (
          <VehicleMarker
            key={vehicle.vehicleId}
            vehicle={vehicle}
            onClick={() => handleMarkerClick(vehicle)}
            isSelected={selectedVehicle?.vehicleId === vehicle.vehicleId}
          />
        ))}

        {selectedVehicle && (
          <AdvancedMarker
            position={{ lat: selectedVehicle.latitude, lng: selectedVehicle.longitude }}
            // Offset the button slightly
            pixelOffset={new google.maps.Size(0, -50)}
          >
            <Button
              variant="outline"
              size="sm"
              className="bg-background hover:bg-muted"
              onClick={(e) => {
                  e.stopPropagation();
                  onShowRouteHistory(selectedVehicle);
              }}
            >
              <History className="mr-2 h-4 w-4" />
              Show Route History
            </Button>
          </AdvancedMarker>
        )}

        <RoutePolyline routePath={routePath} color="#FFC107" weight={4} zIndex={1} />
        <RoutePolyline routePath={highlightedSegment} color="#FFFFFF" weight={6} zIndex={2} />
      </Map>
    </>
  );
}


export function FleetMap({ apiKey, vehicles, selectedVehicle, onShowRouteHistory, routePath, highlightedSegment, routeSegmentToFit, isMapDark, onVehicleSelect }: FleetMapProps) {
  const defaultCenter = { lat: -12.046374, lng: -77.042793 };
  const defaultZoom = 13;

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        gestureHandling={'greedy'}
        mapId="fleetview-map"
        className="w-full h-full"
        disableDefaultUI={true}
        colorScheme={isMapDark ? ColorScheme.DARK : ColorScheme.LIGHT}
        onClick={() => onVehicleSelect(null)}
      >
        <MapControl 
          vehicles={vehicles}
          onVehicleSelect={onVehicleSelect}
          onShowRouteHistory={onShowRouteHistory}
          externalSelectedVehicle={selectedVehicle}
          routePath={routePath}
          highlightedSegment={highlightedSegment}
          routeSegmentToFit={routeSegmentToFit}
        />
      </Map>
    </APIProvider>
  );
}
