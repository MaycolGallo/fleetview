"use client";

import React, { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useFleetState, useFleetDispatch, selectMapVehicles } from "@/context/fleet-context";
import { Flag, Play, Gauge, AlertCircle, Zap, ShieldAlert, Clock } from "lucide-react";

interface LeafletMapControlProps {
  side?: "ida" | "vuelta";
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

// Icon mapping for incidencias
const incidenciaIcons: Record<string, { Icon: React.ElementType; color: string }> = {
  panic: { Icon: ShieldAlert, color: "#EF4444" },
  harsh_accel: { Icon: Zap, color: "#F59E0B" },
  harsh_brake: { Icon: AlertCircle, color: "#F97316" },
  speeding: { Icon: Gauge, color: "#DC2626" },
  excessive_idle: { Icon: Clock, color: "#6B7280" },
};

function catmullRomSpline(
  points: { lat: number; lng: number }[],
  pointsPerSegment: number = 10
): [number, number][] {
  if (points.length < 2) {
    return points.map((p) => [p.lat, p.lng]);
  }

  const result: [number, number][] = [];
  result.push([points[0].lat, points[0].lng]);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

    for (let j = 1; j <= pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;

      const lat =
        0.5 *
        ((2 * p1.lat) +
          (-p0.lat + p2.lat) * t +
          (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 +
          (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3);

      const lng =
        0.5 *
        ((2 * p1.lng) +
          (-p0.lng + p2.lng) * t +
          (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t2 +
          (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t3);

      result.push([lat, lng]);
    }
  }

  return result;
}

export function LeafletMapControl({
  side,
  trackedVehicleIds,
  isOverview,
}: LeafletMapControlProps) {
  const map = useMap();
  const { state } = useFleetState();
  const dispatch = useFleetDispatch();

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
  } = state;

  // Store references to polylines and markers so we can clean them up
  const polylinesRef = React.useRef<L.Polyline[]>([]);
  const markersRef = React.useRef<L.Marker[]>([]);

  const mapVehicles = useMemo(
    () => selectMapVehicles(state, trackedVehicleIds, isOverview),
    [state, trackedVehicleIds, isOverview]
  );

  const halfIndex = Math.ceil(routeGroups.length / 2);
  const displayGroups =
    side === "ida"
      ? routeGroups.slice(0, halfIndex)
      : side === "vuelta"
        ? routeGroups.slice(halfIndex)
        : routeGroups;

  const firstRecord = displayGroups?.[0]?.records?.[0];
  const lastGroup = displayGroups?.[displayGroups.length - 1];
  const lastRecord = lastGroup?.records?.[lastGroup.records.length - 1];

  // Draw polylines
  useEffect(() => {
    // Clean up existing polylines
    polylinesRef.current.forEach((polyline) => {
      map.removeLayer(polyline);
    });
    polylinesRef.current = [];

    // Scenario 1: Draw route groups from Route History
    if (historyVehicle && !isIncidenciasSheetOpen) {
      displayGroups.forEach((group, index) => {
        if (group.id_estado === 6) {
          const isSelected = selectedSegmentIndex === index;
          const rawPath = group.records.map((r) => [r.lat, r.lng] as [number, number]);
          const path = catmullRomSpline(
            group.records.map((r) => ({ lat: r.lat, lng: r.lng }))
          );

          const polylineColor = isSelected ? "#f59e0b" : group.color;
          const polyline = L.polyline(path, {
            color: polylineColor,
            opacity: 0.8,
            weight: isSelected ? 8 : 6,
            zIndex: isSelected ? 4 : 2,
          }).addTo(map);

          polyline.on("click", () => {
            dispatch({ type: "SELECT_ROUTE_SEGMENT", payload: index });
          });

          polylinesRef.current.push(polyline);
        }
      });
    } else {
      // Scenario 2: Draw Fleet Master Route
      const fleetRoutePoints = masterRoute;
      if (!historyVehicle && !isIncidenciasSheetOpen && fleetRoutePoints.length > 0) {
        const halfMaster = Math.ceil(fleetRoutePoints.length / 2);
        let routePoints;
        if (side === "ida") {
          routePoints = fleetRoutePoints.slice(0, halfMaster);
        } else if (side === "vuelta") {
          routePoints = fleetRoutePoints.slice(halfMaster - 1);
        } else {
          routePoints = fleetRoutePoints;
        }

        const path = catmullRomSpline(routePoints, 15);
        const color = side === "vuelta" ? "#3B82F6" : "#22C55E";

        const polyline = L.polyline(path, {
          color: color,
          opacity: 0.4,
          weight: 5,
          zIndex: 1,
        }).addTo(map);

        polylinesRef.current.push(polyline);
      }

      // Scenario 3: Draw simple path through Incidencias
      if (isIncidenciasSheetOpen && incidencias.length >= 2) {
        const sortedIncidencias = [...incidencias].sort(
          (a, b) => a.timestamp - b.timestamp
        );
        const incidenciasPath = sortedIncidencias.map((inc) => [
          inc.lat,
          inc.lng,
        ] as [number, number]);

        const polyline = L.polyline(incidenciasPath, {
          color: "#EF4444",
          opacity: 0.6,
          weight: 4,
          zIndex: 2,
        }).addTo(map);

        polylinesRef.current.push(polyline);
      }
    }

    return () => {
      polylinesRef.current.forEach((polyline) => {
        map.removeLayer(polyline);
      });
      polylinesRef.current = [];
    };
  }, [
    map,
    displayGroups,
    selectedSegmentIndex,
    dispatch,
    isIncidenciasSheetOpen,
    incidencias,
    masterRoute,
    side,
    historyVehicle,
  ]);

  // Draw start and end markers for route history
  useEffect(() => {
    // Clean up existing markers
    markersRef.current.forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    if (
      historyVehicle &&
      firstRecord &&
      lastRecord &&
      selectedSegmentIndex === null &&
      !isIncidenciasSheetOpen
    ) {
      // Start marker
      const startMarker = L.marker([firstRecord.lat, firstRecord.lng], {
        zIndexOffset: 4,
        icon: L.divIcon({
          html: `
            <div class="flex flex-col items-center">
              <div style="background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); color: #000; font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 4px; white-space: nowrap;">
                ${side === "vuelta" ? "Inicia Vuelta" : "Start"}
              </div>
              <div style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid #fff; background-color: #00CC33;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                  <polygon points="8 5 21 12 8 19"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 50],
          popupAnchor: [0, -50],
          className: "",
        }),
      }).addTo(map);
      markersRef.current.push(startMarker);

      // End marker
      const endMarker = L.marker([lastRecord.lat, lastRecord.lng], {
        zIndexOffset: 4,
        icon: L.divIcon({
          html: `
            <div class="flex flex-col items-center">
              <div style="background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); color: #000; font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 4px; white-space: nowrap;">
                ${side === "ida" ? "Fin Ida" : "Finish"}
              </div>
              <div style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid #fff; background-color: #EF4444;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 50],
          popupAnchor: [0, -50],
          className: "",
        }),
      }).addTo(map);
      markersRef.current.push(endMarker);
    }

    return () => {
      markersRef.current.forEach((marker) => {
        map.removeLayer(marker);
      });
      markersRef.current = [];
    };
  }, [
    map,
    historyVehicle,
    firstRecord,
    lastRecord,
    selectedSegmentIndex,
    isIncidenciasSheetOpen,
    side,
  ]);

  // Draw incidencia markers
  useEffect(() => {
    if (!isIncidenciasSheetOpen || !incidencias.length) return;

    incidencias.forEach((inc) => {
      const iconConfig = incidenciaIcons[inc.type] || {
        Icon: AlertCircle,
        color: "#6B7280",
      };
      const color = iconConfig.color;

      const marker = L.marker([inc.lat, inc.lng], {
        zIndexOffset: selectedIncidenciaId === inc.id ? 10 : 5,
        icon: L.divIcon({
          html: `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); color: #000; font-size: 8px; font-weight: 700; padding: 4px 6px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 4px; white-space: nowrap; opacity: ${selectedIncidenciaId === inc.id ? 1 : 0}; transition: opacity 0.3s;">
                ${inc.description}${inc.value ? ` (${inc.value})` : ""}
              </div>
              <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid white; background-color: ${color}; transform: scale(${selectedIncidenciaId === inc.id ? 1.25 : 1}); transition: transform 0.3s;">
                <!-- Placeholder icon - would be rendered based on type -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 50],
          popupAnchor: [0, -50],
          className: "",
        }),
      }).addTo(map);

      marker.on("click", () => {
        dispatch({ type: "SELECT_INCIDENCIA", payload: inc.id });
      });
    });
  }, [map, isIncidenciasSheetOpen, incidencias, selectedIncidenciaId, dispatch]);

  return null;
}
