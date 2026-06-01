"use client";

import React, { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  useFleetState,
  useFleetDispatch,
  selectMapVehicles,
} from "@/context/fleet-context";
import { useAnimatedPosition } from "@/hooks/use-animated-position";
import { Gauge } from "lucide-react";

interface LeafletVehicleMarkersProps {
  side?: "ida" | "vuelta";
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

export function LeafletVehicleMarkers({
  side,
  trackedVehicleIds,
  isOverview,
}: LeafletVehicleMarkersProps) {
  const map = useMap();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();

  const { selectedVehicle, isRoutePlaying, historyVehicle, playbackAnimationDuration } = state;
  const markersRef = React.useRef<Map<number, L.Marker>>(new Map());

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, trackedVehicleIds, isOverview),
    [state, trackedVehicleIds, isOverview]
  );

  // Update markers when vehicles change
  useEffect(() => {
    if (!map) return;

    // Clean up old markers
    markersRef.current.forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current.clear();

    // Add new markers
    mapVehicles.forEach((vehicle) => {
      const isSelected = selectedVehicle?.id_vehiculo === vehicle.id_vehiculo;
      const isPlaybackMarker = !!historyVehicle;
      const color = vehicle.statusColor || "#9E9E9E";
      const speed = parseFloat(vehicle.velocidad) || 0;
      const zIndex = isPlaybackMarker ? 50 : isSelected ? 10 : 1;

      const markerHtml = `
        <div style="
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transform: scale(${isSelected ? 1.25 : 1});
          transition: transform 0.3s ease;
        ">
          ${
            speed > 0
              ? `
            <div style="
              position: absolute;
              top: 0;
              left: 50%;
              transform: translateX(-50%) translateY(-100%);
              margin-bottom: 8px;
              z-index: 10;
              background-color: ${color};
              color: white;
              font-size: 10px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="12" height="12">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              </svg>
              ${speed.toFixed(0)}
            </div>
          `
              : ""
          }
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            border: 3px solid white;
            position: relative;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16"
              style="transform: rotate(${vehicle.rumbo || 0}deg);">
              <polygon points="12 2 21 21 12 18 3 21"/>
            </svg>
            ${isSelected ? `
              <div style="
                position: absolute;
                inset: -6px;
                border: 2px solid rgba(var(--primary-rgb), 0.3);
                border-radius: 50%;
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              "></div>
            ` : ""}
          </div>
        </div>
      `;

      const marker = L.marker([vehicle.lat, vehicle.lng], {
        icon: L.divIcon({
          html: markerHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
          className: "vehicle-marker",
        }),
        zIndexOffset: zIndex,
      })
        .addTo(map)
        .on("click", () => {
          dispatch({ type: "PAN_TO_VEHICLE", payload: vehicle });
        });

      markersRef.current.set(vehicle.id_vehiculo, marker);
    });

    return () => {
      markersRef.current.forEach((marker) => {
        map.removeLayer(marker);
      });
      markersRef.current.clear();
    };
  }, [map, mapVehicles, selectedVehicle, historyVehicle, dispatch]);

  return null;
}
