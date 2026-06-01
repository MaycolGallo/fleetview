"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { useFleetState } from "@/context/fleet-context";
import type { Vehicle } from "@/lib/types";
import "leaflet/dist/leaflet.css";

interface LeafletFleetMapProps {
  side?: "ida" | "vuelta";
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

export function LeafletFleetMap({
  side,
  trackedVehicleIds,
  isOverview,
}: LeafletFleetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { state } = useFleetState();
  const {
    isMapDark,
    vehicles,
    focusedMiniMapId,
    miniMaps,
    mapViewport,
    routeGroups,
    selectedSegmentIndex,
    incidencias,
    historyVehicle,
    isIncidenciasSheetOpen,
    isSplitView,
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

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent re-initialization
    if (mapInstanceRef.current) return;

    try {
      const defaultCenter: L.LatLngExpression = [-12.046374, -77.042793];
      const defaultZoom = isTrackingView || isFocusMode ? 16 : 13;

      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
        attributionControl: true,
      });

      mapInstanceRef.current = map;

      // Choose tile layer based on dark mode
      const tileUrl = isMapDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const attribution = isMapDark
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

      // Add tile layer
      L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 19,
      }).addTo(map);
    } catch (error) {
      console.error("Error initializing Leaflet map:", error);
    }

    return () => {
      // Don't destroy the map on unmount to avoid re-initialization issues
      // Only destroy on complete component removal
    };
  }, []);

  // Update zoom based on tracking view
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const newZoom = isTrackingView || isFocusMode ? 16 : 13;
    mapInstanceRef.current.setZoom(newZoom);
  }, [isTrackingView, isFocusMode]);

  // Update viewport
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Special behavior for tracking panels
    if (trackedVehicles.length > 0) {
      const positions: Array<[number, number]> = [];
      trackedVehicles.forEach((v) => {
        if (v.ultima_ubicacion) {
          positions.push([
            v.ultima_ubicacion.latitud,
            v.ultima_ubicacion.longitud,
          ]);
        }
      });

      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [100, 100],
          maxZoom: 15,
        });
      }
      return;
    }

    // For route view
    if (historyVehicle && routeGroups.length > 0) {
      const positions: Array<[number, number]> = [];
      const selectedRoute = routeGroups[selectedSegmentIndex || 0];
      if (selectedRoute && selectedRoute.route) {
        selectedRoute.route.forEach((point) => {
          if (point.latitud && point.longitud) {
            positions.push([point.latitud, point.longitud]);
          }
        });
      }

      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
      return;
    }

    // For incidencia view
    if (isIncidenciasSheetOpen && incidencias.length > 0) {
      const positions: Array<[number, number]> = [];
      incidencias.forEach((inc) => {
        if (inc.latitud && inc.longitud) {
          positions.push([inc.latitud, inc.longitud]);
        }
      });

      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
      return;
    }

    // Default behavior
    if (mapViewport && mapViewport.center && !isSplitView) {
      mapInstanceRef.current.setView(
        [mapViewport.center.lat, mapViewport.center.lng],
        mapViewport.zoom
      );
    } else if (!isSplitView) {
      mapInstanceRef.current.setView([-12.046374, -77.042793], 13);
    }
  }, [
    trackedVehicles,
    historyVehicle,
    routeGroups,
    selectedSegmentIndex,
    isIncidenciasSheetOpen,
    incidencias,
    mapViewport,
    isSplitView,
  ]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
      className="leaflet-map-container"
    />
  );
}
