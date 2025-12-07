
"use client";

import { APIProvider, Map, useMap, ColorScheme, InfoWindow } from '@vis.gl/react-google-maps';
import type { Vehicle } from '@/lib/types';
import React, { useEffect, useRef, useState } from 'react';
import { VehicleMarker } from './vehicle-marker';
import { Badge } from "./ui/badge";
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Clock, Route } from "lucide-react";
import { cn } from "@/lib/utils";

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

const statusDetails = {
    'active': {
        icon: CheckCircle,
        className: 'text-green-500 bg-green-900/20 border-green-500/30',
        text: 'text-green-400'
    },
    'idle': {
        icon: Clock,
        className: 'text-amber-500 bg-amber-900/20 border-amber-500/30',
        text: 'text-amber-400'
    },
    'out-of-service': {
        icon: AlertCircle,
        className: 'text-red-500 bg-red-900/20 border-red-500/30',
        text: 'text-red-400'
    }
};

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
  onVehicleSelect, 
  selectedVehicle, 
  routePath, 
  highlightedSegment,
  routeSegmentToFit,
  onShowRouteHistory
}: Omit<FleetMapProps, 'apiKey' | 'isMapDark'>) {
  const map = useMap();
  const [infowindowOpen, setInfowindowOpen] = useState(false);
  
  useEffect(() => {
    setInfowindowOpen(!!selectedVehicle);
  }, [selectedVehicle]);
 
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

  const handleInfoWindowClose = () => {
    onVehicleSelect(null);
  }
  
  const handleMarkerClick = (vehicle: Vehicle) => {
    onVehicleSelect(vehicle);
  }

  const status = selectedVehicle ? statusDetails[selectedVehicle.status] : null;
  const StatusIcon = status?.icon;

  return (
    <>
      {vehicles.map((vehicle) => (
        <VehicleMarker
          key={vehicle.vehicleId}
          vehicle={vehicle}
          onClick={() => handleMarkerClick(vehicle)}
          isSelected={selectedVehicle?.vehicleId === vehicle.vehicleId}
        />
      ))}

      {infowindowOpen && selectedVehicle && (
        <InfoWindow
          anchor={{ lat: selectedVehicle.latitude, lng: selectedVehicle.longitude }}
          onCloseClick={handleInfoWindowClose}
          pixelOffset={new google.maps.Size(0, -40)}
        >
          <div className="p-2 bg-card text-card-foreground rounded-lg shadow-lg w-80">
             <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none text-xl">{selectedVehicle.vehicleId}</h4>
                <p className="text-sm text-muted-foreground">Vehicle Details</p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {status && StatusIcon && (
                    <Badge variant="outline" className={cn("capitalize text-sm border", status.className, status.text)}>
                      <StatusIcon className="mr-2 h-4 w-4" />
                      {selectedVehicle.status.replace('-', ' ')}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Latitude</span>
                  <span className="font-mono text-foreground">{selectedVehicle.latitude.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Longitude</span>
                  <span className="font-mono text-foreground">{selectedVehicle.longitude.toFixed(6)}</span>
                </div>
              </div>
              <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {
                    onShowRouteHistory(selectedVehicle);
                  }}
              >
                  <Route className="mr-2 h-4 w-4" />
                  Show Route History
              </Button>
            </div>
          </div>
        </InfoWindow>
      )}


      <RoutePolyline routePath={routePath} color="#FFC107" weight={4} zIndex={1} />
      <RoutePolyline routePath={highlightedSegment} color="#FFFFFF" weight={6} zIndex={2} />
    </>
  );
}


export function FleetMap({ apiKey, vehicles, onVehicleSelect, selectedVehicle, routePath, highlightedSegment, routeSegmentToFit, isMapDark, onShowRouteHistory }: FleetMapProps) {
  const defaultCenter = { lat: -12.046374, lng: -77.042793 };
  const defaultZoom = 13;
  const markerClicked = useRef(false);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (markerClicked.current) {
        markerClicked.current = false;
        return;
    }
    onVehicleSelect(null);
  };
  
  const handleMarkerClick = (vehicle: Vehicle) => {
    markerClicked.current = true; // Set flag when marker is clicked
    onVehicleSelect(vehicle);
  }

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
        onClick={handleMapClick}
      >
        <MapControl 
          vehicles={vehicles}
          onVehicleSelect={handleMarkerClick}
          selectedVehicle={selectedVehicle}
          routePath={routePath}
          highlightedSegment={highlightedSegment}
          routeSegmentToFit={routeSegmentToFit}
          onShowRouteHistory={onShowRouteHistory}
        />
      </Map>
    </APIProvider>
  );
}
