
"use client";

import { APIProvider, Map, useMap, ColorScheme } from '@vis.gl/react-google-maps';
import type { Vehicle } from '@/lib/types';
import React, { useEffect, useRef, useState } from 'react';
import { VehicleMarker } from './vehicle-marker';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, Clock, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"


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
    // Clean up existing polyline if it exists
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
  routeSegmentToFit,
  onShowRouteHistory
}: Omit<FleetMapProps, 'apiKey' | 'isMapDark'>) {
  const map = useMap();
  const [dropdownVehicle, setDropdownVehicle] = useState<Vehicle | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!map || !routeSegmentToFit || routeSegmentToFit.length === 0) return;
  
    if (routeSegmentToFit.length === 1) {
      // If there's only one point, pan to it and set a reasonable zoom level.
      map.panTo(routeSegmentToFit[0]);
      map.setZoom(16);
    } else {
      // If there are multiple points (a route segment), fit them in the view.
      const bounds = new google.maps.LatLngBounds();
      routeSegmentToFit.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, 100);
    }
  }, [map, routeSegmentToFit]);

  const handleContextMenu = (e: google.maps.MapMouseEvent, vehicle: Vehicle) => {
    if (!map) return;
    e.domEvent.preventDefault();
    e.domEvent.stopPropagation();
    
    // We need to calculate the pixel position for the dropdown menu
    const projection = map.getProjection();
    if (!projection) return;
    
    const pos = projection.fromLatLngToPoint(e.latLng!);
    if (!pos) return;
    
    // This is a bit of a hack to get the container offset
    const mapDiv = map.getDiv();
    const mapRect = mapDiv.getBoundingClientRect();
    const scale = Math.pow(2, map.getZoom()!);
    const worldPoint = projection.fromLatLngToPoint(e.latLng!);
    const pixelOffset = new google.maps.Point(
      Math.floor(worldPoint!.x * scale),
      Math.floor(worldPoint!.y * scale)
    );
    
    const mapTopLeft = new google.maps.Point(mapRect.left, mapRect.top);
    const point = new google.maps.Point(
      pixelOffset.x - mapTopLeft.x,
      pixelOffset.y - mapTopLeft.y
    );

    const fromDivPixel = projection.fromLatLngToContainerPixel(e.latLng!);

    if (fromDivPixel) {
      setDropdownPosition({ x: fromDivPixel.x, y: fromDivPixel.y });
      setDropdownVehicle(vehicle);
    }
  };
  
  const selectedStatus = selectedVehicle ? statusDetails[selectedVehicle.status] : null;
  const SelectedStatusIcon = selectedStatus?.icon;

  return (
    <>
      {vehicles.map((vehicle) => (
        <VehicleMarker
          key={vehicle.vehicleId}
          vehicle={vehicle}
          selectedVehicle={selectedVehicle}
          onVehicleSelect={onVehicleSelect}
          onContextMenu={(e) => handleContextMenu(e, vehicle)}
        />
      ))}
      <RoutePolyline routePath={routePath} color="#FFC107" weight={4} zIndex={1} />
      <RoutePolyline routePath={highlightedSegment} color="#FFFFFF" weight={6} zIndex={2} />

      {selectedVehicle && (
        <Popover open={!!selectedVehicle} onOpenChange={(open) => !open && onVehicleSelect(null)}>
           <PopoverContent
              style={{
                position: 'absolute',
                top: '-160px',
                left: '-150px',
              }}
              className="w-80 bg-card/95 backdrop-blur-sm border-primary/20"
              onOpenAutoFocus={(e) => e.preventDefault()}
           >
              <div className="grid gap-4">
                  <div className="space-y-2">
                      <h4 className="font-medium leading-none text-xl">{selectedVehicle.vehicleId}</h4>
                      <p className="text-sm text-muted-foreground">Vehicle Details</p>
                  </div>
                  <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status</span>
                           {selectedStatus && SelectedStatusIcon && (
                              <Badge variant="outline" className={cn("capitalize text-sm border", selectedStatus.className, selectedStatus.text)}>
                                <SelectedStatusIcon className="mr-2 h-4 w-4" />
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
              </div>
          </PopoverContent>
        </Popover>
      )}

      {dropdownVehicle && dropdownPosition && (
        <div style={{ position: 'absolute', left: dropdownPosition.x, top: dropdownPosition.y }}>
            <DropdownMenu open={!!dropdownVehicle} onOpenChange={(open) => !open && setDropdownVehicle(null)}>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                        onShowRouteHistory(dropdownVehicle);
                        setDropdownVehicle(null);
                    }}>
                        <Route className="mr-2 h-4 w-4" />
                        <span>Show Route History</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )}
    </>
  );
}


export function FleetMap({ apiKey, vehicles, onVehicleSelect, selectedVehicle, routePath, highlightedSegment, routeSegmentToFit, isMapDark, onShowRouteHistory }: FleetMapProps) {
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
        disableDefaultUI={true}
        colorScheme={isMapDark ? ColorScheme.DARK : ColorScheme.LIGHT}
        onClick={() => onVehicleSelect(null)}
      >
        <MapControl 
          vehicles={vehicles}
          onVehicleSelect={onVehicleSelect}
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
