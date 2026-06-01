"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { useFleetState } from "@/context/fleet-context";
import { useEffect, useRef } from "react";
import type { Vehicle } from "@/lib/types";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue in Next.js
const defaultIcon = L.icon({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LeafletFleetMapProps {
  side?: "ida" | "vuelta";
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

function MapContent({
  side,
  trackedVehicleIds,
  isOverview,
  tileUrl,
  attribution,
  defaultCenter,
  defaultZoom,
  vehicles,
  selectedVehicleId,
}: LeafletFleetMapProps & {
  tileUrl: string;
  attribution: string;
  defaultCenter: [number, number];
  defaultZoom: number;
  vehicles: Vehicle[];
  selectedVehicleId?: number;
}) {
  return (
    <>
      <TileLayer url={tileUrl} attribution={attribution} maxZoom={19} />

      {/* Vehicle Markers */}
      {vehicles.map((vehicle) => {
        // Filter by side if specified
        if (side && vehicle.lado !== side) return null;

        // Filter by tracking if specified
        if (trackedVehicleIds && !trackedVehicleIds.includes(vehicle.id_vehiculo))
          return null;

        const position: [number, number] = [vehicle.latitud, vehicle.longitud];
        const isSelected = vehicle.id_vehiculo === selectedVehicleId;

        const vehicleIcon = L.divIcon({
          className: "vehicle-marker",
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              background: ${isSelected ? "#3b82f6" : "#10b981"};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              transform: rotate(${vehicle.rumbo || 0}deg);
              font-weight: bold;
              color: white;
              font-size: 14px;
            ">
              ▲
            </div>
          `,
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

      {/* Route Polylines */}
      {vehicles.map((vehicle) => {
        if (!vehicle.ruta || vehicle.ruta.length === 0) return null;

        // Filter by side if specified
        if (side && vehicle.lado !== side) return null;

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
            dashArray={side === vehicle.lado ? undefined : "5, 5"}
          />
        );
      })}
    </>
  );
}

export function LeafletFleetMap({
  side,
  trackedVehicleIds,
  isOverview,
}: LeafletFleetMapProps) {
  const mapRef = useRef(false);
  const { state } = useFleetState();
  const { isMapDark, vehicles, focusedMiniMapId, miniMaps, selectedVehicleId } = state;

  const isFocusMode = isOverview && focusedMiniMapId;

  const trackedVehicles =
    trackedVehicleIds
      ?.map((id) => vehicles.find((v) => v.id_vehiculo === id))
      .filter(Boolean) || [];
  const isTrackingView = trackedVehicles.length > 0;

  const defaultCenter: [number, number] = [-12.046374, -77.042793];
  const defaultZoom = isTrackingView || isFocusMode ? 16 : 13;

  const tileUrl = isMapDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = isMapDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Prevent double-mounting in StrictMode
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
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
      />
    </MapContainer>
  );
}
