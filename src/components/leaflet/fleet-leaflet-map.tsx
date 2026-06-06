
'use client';

import React, { useMemo } from 'react';
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
}

/**
 * Internal Sync component to bridge Leaflet context with our unified hook
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

export default function FleetLeafletMap(props: FleetLeafletMapProps) {
  const { miniMapId, manualVehicleIds, isMainMap, side } = props;
  const { state } = useFleetState();
  const { isMapDark, mapType } = state;

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, miniMapId, manualVehicleIds, isMainMap), 
    [state, miniMapId, manualVehicleIds, isMainMap]
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
        {/* Dynamic Key forces tile refresh on theme/provider/type switch */}
        <TileLayer key={`${tileUrl}-${isMapDark}`} url={tileUrl} attribution={attribution} />
        
        <MapViewportSync {...props} />

        <LeafletRoutePolylines side={side} />

        {mapVehicles.map((vehicle, idx) => (
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
