"use client";

import React, { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { useFleetState } from "@/context/fleet-context";
import type { Vehicle } from "@/lib/types";
import { LeafletMapControl } from "./leaflet-map-control";
import { LeafletVehicleMarkers } from "./leaflet-vehicle-markers";
import "leaflet/dist/leaflet.css";

interface LeafletFleetMapProps {
  side?: "ida" | "vuelta";
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

// Fix for default markers in Leaflet
const defaultIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.setIcon(defaultIcon);

interface MapViewerProps {
  side?: "ida" | "vuelta";
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

function MapViewer({ side, trackedVehicleIds, isOverview }: MapViewerProps) {
  const map = useMap();
  const { state } = useFleetState();
  const {
    mapViewport,
    routeGroups,
    selectedSegmentIndex,
    incidencias,
    selectedIncidenciaId,
    isIncidenciasSheetOpen,
    historyVehicle,
    masterRoute,
    isSplitView,
    focusedMiniMapId,
    miniMaps,
    vehicles,
  } = state;

  const isFocusMode = isOverview && focusedMiniMapId;
  const focusedGroup = isFocusMode
    ? miniMaps.find((m) => m.id === focusedMiniMapId)
    : null;

  const trackedVehicles =
    trackedVehicleIds
      ?.map((id) => vehicles.find((v) => v.id_vehiculo === id))
      .filter(Boolean) || [];
  const isTrackingView = trackedVehicles.length > 0;

  // Handle viewport updates
  useEffect(() => {
    if (!map) return;

    // Special behavior for tracking panels or Focused group
    const isFocusMain = isOverview && focusedMiniMapId;
    const trackingIds = isFocusMain
      ? miniMaps.find((m) => m.id === focusedMiniMapId)?.vehicleIds
      : trackedVehicleIds;

    if (trackingIds && trackingIds.length > 0) {
      const trackedVehiclesFiltered = vehicles.filter((v) =>
        trackingIds.includes(v.id_vehiculo)
      );
      if (trackedVehiclesFiltered.length === 1) {
        const v = trackedVehiclesFiltered[0];
        map.setView([v.lat, v.lng], 16, { animate: true });
      } else if (trackedVehiclesFiltered.length > 1) {
        const bounds = L.latLngBounds(
          trackedVehiclesFiltered.map((v) => [v.lat, v.lng])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      return;
    }

    if (mapViewport.type === "idle" || mapViewport.type === "initial") {
      // Special case for Split View in Fleet Management
      if (
        map &&
        isSplitView &&
        !historyVehicle &&
        !isIncidenciasSheetOpen &&
        masterRoute.length > 0
      ) {
        try {
          const halfIndex = Math.ceil(masterRoute.length / 2);
          const points =
            side === "ida"
              ? masterRoute.slice(0, halfIndex)
              : masterRoute.slice(halfIndex - 1);
          const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
          map.fitBounds(bounds, { padding: [50, 50] });
        } catch (e) {
          console.warn("Could not fit bounds", e);
        }
      }
      return;
    }

    try {
      switch (mapViewport.type) {
        case "pan_to_vehicle": {
          const { lat, lng } = mapViewport.payload;
          map.setView([lat, lng], Math.max(map.getZoom(), 15), {
            animate: true,
          });
          break;
        }
        case "fit_bounds":
        case "fit_route": {
          const points = mapViewport.payload;
          if (points && points.length > 0) {
            if (points.length === 1) {
              map.setView([points[0].lat, points[0].lng], 15, {
                animate: true,
              });
            } else {
              const bounds = L.latLngBounds(
                points.map((p) => [p.lat, p.lng])
              );
              map.fitBounds(bounds, { padding: [100, 100] });
            }
          }
          break;
        }
        default:
          break;
      }
    } catch (e) {
      console.warn("Map interaction failed", e);
    }
  }, [
    map,
    mapViewport,
    isSplitView,
    historyVehicle,
    isIncidenciasSheetOpen,
    masterRoute,
    side,
    trackedVehicleIds,
    vehicles,
    focusedMiniMapId,
    isOverview,
    miniMaps,
  ]);

  return null;
}

export function LeafletFleetMap({
  side,
  trackedVehicleIds,
  isOverview,
}: LeafletFleetMapProps) {
  const { state } = useFleetState();
  const { isMapDark, vehicles, focusedMiniMapId, miniMaps } = state;

  const isFocusMode = isOverview && focusedMiniMapId;

  const trackedVehicles =
    trackedVehicleIds
      ?.map((id) => vehicles.find((v) => v.id_vehiculo === id))
      .filter(Boolean) || [];
  const isTrackingView = trackedVehicles.length > 0;

  // Default center and zoom
  const defaultCenter: [number, number] = [-12.046374, -77.042793];
  const defaultZoom = isTrackingView || isFocusMode ? 16 : 13;

  // Choose tile layer based on dark mode
  const tileUrl = isMapDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = isMapDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ width: "100%", height: "100%" }}
      className="relative z-0"
    >
      <TileLayer url={tileUrl} attribution={attribution} />
      <MapViewer
        side={side}
        trackedVehicleIds={trackedVehicleIds}
        isOverview={isOverview}
      />
      <LeafletMapControl
        side={side}
        trackedVehicleIds={trackedVehicleIds}
        isOverview={isOverview}
      />
      <LeafletVehicleMarkers
        side={side}
        trackedVehicleIds={trackedVehicleIds}
        isOverview={isOverview}
      />
    </MapContainer>
  );
}
