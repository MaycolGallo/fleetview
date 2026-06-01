"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { useFleetState } from "@/context/fleet-context";
import { useEffect, useRef, useMemo, memo } from "react";
import type { Vehicle } from "@/lib/types";
import "leaflet/dist/leaflet.css";

interface LeafletFleetMapProps {
  side?: "ida" | "vuelta";
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

const MapContent = memo(function MapContent({
  side,
  trackedVehicleIds,
  tileUrl,
  attribution,
  vehicles,
  selectedVehicleId,
}: LeafletFleetMapProps & {
  tileUrl: string;
  attribution: string;
  vehicles: Vehicle[];
  selectedVehicleId?: number;
}) {
  // Filter vehicles once
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      if (side && vehicle.lado !== side) return false;
      if (trackedVehicleIds && !trackedVehicleIds.includes(vehicle.id_vehiculo))
        return false;
      return true;
    });
  }, [vehicles, side, trackedVehicleIds]);

  return (
    <>
      <TileLayer 
        url={tileUrl} 
        attribution={attribution} 
        maxZoom={19}
      />

      {/* Vehicle Markers */}
      {filteredVehicles.map((vehicle) => {
        const position: [number, number] = [vehicle.latitud, vehicle.longitud];
        const isSelected = vehicle.id_vehiculo === selectedVehicleId;

        const vehicleIcon = L.divIcon({
          className: "vehicle-marker",
          html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:${isSelected ? "#3b82f6" : "#10b981"};border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);transform:rotate(${vehicle.rumbo || 0}deg);font-weight:bold;color:white;font-size:14px;">▲</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
        });

        return (
          <Marker key={vehicle.id_vehiculo} position={position} icon={vehicleIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{vehicle.placa}</p>
                <p>Conductor: {vehicle.conductor}</p>
                <p>Velocidad: {vehicle.velocidad} km/h</p>
                <p>Estado: {vehicle.estado}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Route Polylines - Only render for visible vehicles */}
      {filteredVehicles.map((vehicle) => {
        if (!vehicle.ruta || vehicle.ruta.length === 0) return null;

        const polylinePositions: [number, number][] = vehicle.ruta
          .map((point: any) => [point.latitud, point.longitud])
          .filter(([lat, lng]) => lat && lng);

        if (polylinePositions.length === 0) return null;

        return (
          <Polyline
            key={`route-${vehicle.id_vehiculo}`}
            positions={polylinePositions}
            color={vehicle.lado === "ida" ? "#ef4444" : "#3b82f6"}
            weight={2}
            opacity={0.6}
          />
        );
      })}
    </>
  );
});

export function LeafletFleetMap({
  side,
  trackedVehicleIds,
  isOverview,
}: LeafletFleetMapProps) {
  const mapRef = useRef(false);
  const { state } = useFleetState();
  const { isMapDark, vehicles, focusedMiniMapId, selectedVehicleId } = state;

  const isFocusMode = isOverview && focusedMiniMapId;
  const trackedVehicles = useMemo(
    () =>
      trackedVehicleIds
        ?.map((id) => vehicles.find((v) => v.id_vehiculo === id))
        .filter(Boolean) || [],
    [trackedVehicleIds, vehicles]
  );
  const isTrackingView = trackedVehicles.length > 0;

  const defaultCenter: [number, number] = [-12.046374, -77.042793];
  const defaultZoom = isTrackingView || isFocusMode ? 16 : 13;

  const { tileUrl, attribution } = useMemo(
    () => ({
      tileUrl: isMapDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: isMapDark
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }),
    [isMapDark]
  );

  useEffect(() => {
    mapRef.current = true;
  }, []);

  if (!mapRef.current) return null;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ width: "100%", height: "100%" }}
      className="z-0"
    >
      <MapContent
        side={side}
        trackedVehicleIds={trackedVehicleIds}
        isOverview={isOverview}
        tileUrl={tileUrl}
        attribution={attribution}
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
      />
    </MapContainer>
  );
}
