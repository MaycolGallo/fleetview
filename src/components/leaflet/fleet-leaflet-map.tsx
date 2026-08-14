
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useFleetState, selectMapVehicles } from '@/context/fleet-context';
import { LeafletVehicleMarker } from './leaflet-vehicle-marker';
import { useMapViewport } from '@/hooks/use-map-viewport';
import { LeafletRoutePolylines } from './leaflet-route-polylines';

interface FleetLeafletMapProps {
  side?: 'ida' | 'vuelta';
  miniMapId?: string;
  manualVehicleIds?: number[];
  isMainMap?: boolean;
  isVisible?: boolean;
}

/**
 * Internal Sync component to bridge Leaflet context with our unified hook.
 */
function MapViewportSync(props: FleetLeafletMapProps) {
  const map = useMap();

  useMapViewport({
    map,
    provider: 'leaflet',
    ...props
  });

  return null;
}

const ONE_METER_LATITUDE = 1 / 111_320;
const ONE_METER_LONGITUDE_AT_LIMA = 1 / (111_320 * Math.cos((-12.046374 * Math.PI) / 180));
const CLOSE_VEHICLE_RADIUS_METERS = 1;

function distanceInMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const latMeters = (a.lat - b.lat) / ONE_METER_LATITUDE;
  const lngMeters = (a.lng - b.lng) / ONE_METER_LONGITUDE_AT_LIMA;
  return Math.hypot(latMeters, lngMeters);
}

export default function FleetLeafletMap(props: FleetLeafletMapProps) {
  const { miniMapId, manualVehicleIds, isMainMap, side, isVisible = true } = props;
  const { state } = useFleetState();
  const { isMapDark, mapType, selectedVehicle } = state;
  const [temporarilyHiddenVehicleIds, setTemporarilyHiddenVehicleIds] = useState<Set<number>>(new Set());

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, miniMapId, manualVehicleIds, isMainMap),
    [state, miniMapId, manualVehicleIds, isMainMap]
  );

  // This is intentionally local to this map. Selecting a vehicle hides only its
  // nearby neighbors; FleetState and the shared vehicle list remain untouched.
  useEffect(() => {
    if (!isMainMap || !selectedVehicle) {
      setTemporarilyHiddenVehicleIds(new Set());
      return;
    }

    const nearbyVehicles = mapVehicles.filter((vehicle) =>
      vehicle.id_vehiculo !== selectedVehicle.id_vehiculo &&
      distanceInMeters(vehicle, selectedVehicle) <= CLOSE_VEHICLE_RADIUS_METERS
    );

    if (nearbyVehicles.length < 2) {
      setTemporarilyHiddenVehicleIds(new Set());
      return;
    }

    setTemporarilyHiddenVehicleIds(new Set(nearbyVehicles.map((vehicle) => vehicle.id_vehiculo)));
  }, [isMainMap, mapVehicles, selectedVehicle]);

  const visibleMapVehicles = useMemo(
    () => mapVehicles.filter((vehicle) => !temporarilyHiddenVehicleIds.has(vehicle.id_vehiculo)),
    [mapVehicles, temporarilyHiddenVehicleIds]
  );

  // Tile sources
  const standardTile = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const satelliteTile = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  
  const tileUrl = mapType === 'satellite' ? satelliteTile : standardTile;
  const attribution = mapType === 'satellite' 
    ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[-12.046374, -77.042793]} 
        zoom={13} 
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer key={`${tileUrl}-${isMapDark}`} url={tileUrl} attribution={attribution} />
        
        <MapViewportSync {...props} isVisible={isVisible} />

        <LeafletRoutePolylines side={side} />

        {visibleMapVehicles.map((vehicle, idx) => (
          <LeafletVehicleMarker 
            key={vehicle.id_vehiculo} 
            vehicle={vehicle} 
            index={idx} 
            showPopup={isMainMap && !miniMapId}
          />
        ))}
      </MapContainer>
    </div>
  );
}
