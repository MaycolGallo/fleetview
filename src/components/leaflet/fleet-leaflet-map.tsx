
'use client';

import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useFleetState, selectMapVehicles } from '@/context/fleet-context';
import { LeafletVehicleMarker } from './leaflet-vehicle-marker';
import { useMapViewport } from '@/hooks/use-map-viewport';
import { LeafletRoutePolylines } from './leaflet-route-polylines';
import { useDeoverlappedPositions } from '@/hooks/use-deoverlapped-positions';

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

export default function FleetLeafletMap(props: FleetLeafletMapProps) {
  const { miniMapId, manualVehicleIds, isMainMap, side, isVisible = true } = props;
  const { state } = useFleetState();
  const { isMapDark, mapType, selectedVehicle } = state;

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, miniMapId, manualVehicleIds, isMainMap),
    [state, miniMapId, manualVehicleIds, isMainMap]
  );

  const selectedMapVehicle = selectedVehicle && mapVehicles.some(
    (vehicle) => vehicle.id_vehiculo === selectedVehicle.id_vehiculo
  ) ? selectedVehicle : null;

  const deoverlappedVehicles = useDeoverlappedPositions(
    mapVehicles,
    selectedMapVehicle?.id_vehiculo ?? null,
  );

  const clusterVehicles = useMemo(
    () => deoverlappedVehicles.filter(
      (vehicle) => vehicle.id_vehiculo !== selectedMapVehicle?.id_vehiculo
    ),
    [deoverlappedVehicles, selectedMapVehicle?.id_vehiculo]
  );

  const deoverlappedSelectedVehicle = deoverlappedVehicles.find(
    (vehicle) => vehicle.id_vehiculo === selectedMapVehicle?.id_vehiculo
  );

  const clusterIcon = useMemo(() => (cluster: L.MarkerCluster) => {
    const count = cluster.getChildCount();
    return L.divIcon({
      html: `<div class="fleet-marker-cluster"><span>${count}</span></div>`,
      className: 'fleet-marker-cluster-wrapper',
      iconSize: L.point(44, 44),
      iconAnchor: L.point(22, 22),
    });
  }, []);

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

        <MarkerClusterGroup
          key={`vehicle-clusters-${selectedMapVehicle?.id_vehiculo ?? 'none'}-${clusterVehicles.length}`}
          chunkedLoading
          maxClusterRadius={44}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
          zoomToBoundsOnClick
          iconCreateFunction={clusterIcon}
        >
          {clusterVehicles.map((vehicle, idx) => (
            <LeafletVehicleMarker
              key={vehicle.id_vehiculo}
              vehicle={vehicle}
              index={idx}
              showPopup={isMainMap && !miniMapId}
            />
          ))}
        </MarkerClusterGroup>

        {deoverlappedSelectedVehicle && (
          <LeafletVehicleMarker
            key={`selected-${deoverlappedSelectedVehicle.id_vehiculo}`}
            vehicle={deoverlappedSelectedVehicle}
            index={10_000}
            showPopup={isMainMap && !miniMapId}
          />
        )}
      </MapContainer>
    </div>
  );
}
