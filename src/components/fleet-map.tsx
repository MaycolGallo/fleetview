
"use client";

import { APIProvider, Map, useMap, ColorScheme, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Vehicle } from '@/lib/types';
import React, { useEffect, useRef, useState } from 'react';
import { VehicleMarker, type VehicleAction } from './vehicle-marker';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { XIcon } from 'lucide-react';

interface FleetMapProps {
  apiKey: string;
  vehicles: Vehicle[];
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onShowRouteHistory: (vehicle: Vehicle) => void;
  onAction: (action: VehicleAction, vehicle: Vehicle) => void;
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

function MapControl({ 
  vehicles, 
  routePath, 
  highlightedSegment,
  routeSegmentToFit,
  onVehicleSelect,
  onShowRouteHistory,
  onAction,
  externalSelectedVehicle,
  isMapDark,
}: {
  vehicles: Vehicle[];
  routePath: { lat: number; lng: number }[] | null;
  highlightedSegment: { lat: number; lng: number }[] | null;
  routeSegmentToFit: { lat: number; lng: number }[] | null;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onShowRouteHistory: (vehicle: Vehicle) => void;
  onAction: (action: VehicleAction, vehicle: Vehicle) => void;
  externalSelectedVehicle: Vehicle | null;
  isMapDark: boolean;
}) {
  const map = useMap();
  const [infoVehicle, setInfoVehicle] = useState<Vehicle | null>(null);

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
    onVehicleSelect(null);
    setInfoVehicle(null);
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    onVehicleSelect(vehicle);
    setInfoVehicle(vehicle);
  }

  // When external selection changes (e.g. from list), close local info window
  useEffect(() => {
    setInfoVehicle(externalSelectedVehicle);
  }, [externalSelectedVehicle]);


  return (
    <>
    <Map 
        defaultCenter={{ lat: -12.046374, lng: -77.042793 }}
        defaultZoom={13}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId={'a3b0c4d2e9f3g4h5'}
        onClick={handleMapClick}
        scheme={isMapDark ? ColorScheme.DARK : ColorScheme.LIGHT}
    >
        {vehicles.map((vehicle) => (
            <VehicleMarker
            key={vehicle.vehicleId}
            vehicle={vehicle}
            onVehicleSelect={() => handleVehicleClick(vehicle)}
            isSelected={externalSelectedVehicle?.vehicleId === vehicle.vehicleId || infoVehicle?.vehicleId === vehicle.vehicleId}
            onAction={onAction}
            />
        ))}

        {infoVehicle && (
            <AdvancedMarker
                position={{lat: infoVehicle.latitude, lng: infoVehicle.longitude}}
            >
                <div className="bg-popover text-popover-foreground rounded-lg shadow-lg p-3 w-60 border border-border transform -translate-y-[calc(100%+1rem)]">
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

      <RoutePolyline routePath={routePath} color="#FFC107" weight={4} zIndex={1} />
      <RoutePolyline routePath={highlightedSegment} color="#FFFFFF" weight={6} zIndex={2} />
    </Map>
    </>
  );
}


export function FleetMap({ apiKey, vehicles, selectedVehicle, onShowRouteHistory, onAction, routePath, highlightedSegment, routeSegmentToFit, isMapDark, onVehicleSelect }: FleetMapProps) {
  
  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full">
        <MapControl 
          vehicles={vehicles}
          onVehicleSelect={onVehicleSelect}
          onShowRouteHistory={onShowRouteHistory}
          onAction={onAction}
          externalSelectedVehicle={selectedVehicle}
          routePath={routePath}
          highlightedSegment={highlightedSegment}
          routeSegmentToFit={routeSegmentToFit}
          isMapDark={isMapDark}
        />
      </div>
    </APIProvider>
  );
}
