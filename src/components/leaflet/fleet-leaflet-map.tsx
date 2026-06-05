
'use client';

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, useMap, Polyline, CircleMarker } from 'react-leaflet';
import { useFleetState, useFleetDispatch, selectMapVehicles } from '@/context/fleet-context';
import { LeafletVehicleMarker } from './leaflet-vehicle-marker';
import { useMapViewport } from '@/hooks/use-map-viewport';

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
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();

  useMapViewport({
    map,
    provider: 'leaflet',
    state,
    dispatch,
    ...props
  });

  return null;
}

export default function FleetLeafletMap(props: FleetLeafletMapProps) {
  const { side, miniMapId, manualVehicleIds, isMainMap } = props;
  const { state } = useFleetState();
  const { routeGroups, incidencias, isIncidenciasSheetOpen, historyVehicle, masterRoute } = state;

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, miniMapId, manualVehicleIds, isMainMap), 
    [state, miniMapId, manualVehicleIds, isMainMap]
  );

  const fleetRoutePoints = useMemo(() => {
      if (!side || historyVehicle || isIncidenciasSheetOpen) return null;
      if (!masterRoute || masterRoute.length === 0) return null;
      
      const halfMaster = Math.ceil(masterRoute.length / 2);
      if (side === 'ida') return masterRoute.slice(0, halfMaster);
      if (side === 'vuelta') return masterRoute.slice(halfMaster - 1);
      return null;
  }, [masterRoute, historyVehicle, isIncidenciasSheetOpen, side]);

  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[-12.046374, -77.042793]} 
        zoom={13} 
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer url={tileUrl} attribution={attribution} />
        
        <MapViewportSync {...props} />

        {mapVehicles.map((vehicle, idx) => (
          <LeafletVehicleMarker key={vehicle.id_vehiculo} vehicle={vehicle} index={idx} />
        ))}

        {historyVehicle && !isIncidenciasSheetOpen && routeGroups.map((group, idx) => {
           if (group.id_estado === 6) {
             const points = group.records.map(r => [r.lat, r.lng] as [number, number]);
             return (
              <Polyline 
                key={`hist-${idx}`} 
                positions={points} 
                color={group.color} 
                weight={6} 
                opacity={0.8} 
              />
            );
           }
           if (group.id_estado === 4 || group.id_estado === 5) {
             const first = group.records[0];
             return (
                <CircleMarker 
                  key={`stop-${idx}`} 
                  center={[first.lat, first.lng]} 
                  radius={8} 
                  pathOptions={{ fillColor: group.color, color: 'white', weight: 2, fillOpacity: 1 }}
                />
             );
           }
           return null;
        })}

        {fleetRoutePoints && (
          <Polyline 
            positions={fleetRoutePoints.map(p => [p.lat, p.lng] as [number, number])}
            color={side === 'vuelta' ? '#3B82F6' : '#22C55E'}
            weight={5}
            opacity={0.4}
            dashArray="10, 10"
          />
        )}

        {isIncidenciasSheetOpen && incidencias.length > 1 && (
           <Polyline 
             positions={incidencias.map(i => [i.lat, i.lng] as [number, number])} 
             color="#EF4444" 
             weight={4} 
             dashArray="5, 10"
             opacity={0.6}
           />
        )}
      </MapContainer>
    </div>
  );
}
