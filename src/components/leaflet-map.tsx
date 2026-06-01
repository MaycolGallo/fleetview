"use client";

import L from "leaflet";
import { useFleetState } from "@/context/fleet-context";
import { useEffect, useRef, useMemo } from "react";
import type { Vehicle } from "@/lib/types";
import "leaflet/dist/leaflet.css";

interface LeafletFleetMapProps {
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

let mapInstance: L.Map | null = null;

export function LeafletFleetMap({
  trackedVehicleIds,
  isOverview,
}: LeafletFleetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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

  const defaultZoom = isTrackingView || isFocusMode ? 16 : 13;
  const defaultCenter: L.LatLngExpression = [-12.046374, -77.042793];

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

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;

    // Only initialize once globally
    if (mapInstance) {
      mapInstance.setView(defaultCenter, defaultZoom);
      return;
    }

    try {
      mapInstance = L.map(containerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 19,
      }).addTo(mapInstance);
    } catch (error) {
      console.error("Map initialization error:", error);
    }

    return () => {
      // Don't destroy map on unmount to prevent re-initialization issues
    };
  }, []);

  // Update zoom when tracking changes
  useEffect(() => {
    if (!mapInstance) return;
    mapInstance.setZoom(defaultZoom);
  }, [defaultZoom]);

  // Update tile layer when dark mode changes
  useEffect(() => {
    if (!mapInstance) return;

    mapInstance.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstance!.removeLayer(layer);
      }
    });

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
    }).addTo(mapInstance);
  }, [isMapDark]);

  // Update markers
  useEffect(() => {
    if (!mapInstance) return;

    // Remove old markers
    mapInstance.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstance!.removeLayer(layer);
      }
    });

    // Add vehicle markers
    vehicles.forEach((vehicle) => {
      if (trackedVehicleIds && !trackedVehicleIds.includes(vehicle.id_vehiculo)) {
        return;
      }

      const position: L.LatLngExpression = [vehicle.lat, vehicle.lng];
      const isSelected = vehicle.id_vehiculo === selectedVehicleId;

      const vehicleIcon = L.divIcon({
        className: "vehicle-marker",
        html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:${isSelected ? "#3b82f6" : "#10b981"};border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);font-weight:bold;color:white;font-size:14px;">▲</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });

      const marker = L.marker(position, { icon: vehicleIcon });
      marker.bindPopup(`
        <div class="text-sm">
          <p class="font-bold">${vehicle.placa}</p>
          <p>Velocidad: ${vehicle.velocidad} km/h</p>
          <p>Estado: ${vehicle.statusName}</p>
        </div>
      `);
      marker.addTo(mapInstance);
    });
  }, [vehicles, trackedVehicleIds, selectedVehicleId]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
      className="relative z-0"
    />
  );
}
