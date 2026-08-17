import { useEffect, useMemo, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Vehicle } from "@/lib/types";

export function useDeoverlappedPositions(
  items: Vehicle[],
  selectedId: number | null,
  thresholdPx = 32,
) {
  const map = useMap();
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!map) return;
    const onChange = () => forceTick((t) => t + 1);
    map.on('zoomend moveend', onChange);
    return () => {
      map.off('zoomend moveend', onChange);
    };
  }, [map]);

  return useMemo(() => {
    if (!map || !selectedId) return items;

    const selected = items.find((v) => v.id_vehiculo === selectedId);
    if (!selected) return items;

    const selectedPt = map.latLngToContainerPoint([selected.lat, selected.lng]);

    const nearby = items.filter((v) => {
      if (v.id_vehiculo === selectedId) return true;
      const pt = map.latLngToContainerPoint([v.lat, v.lng]);
      return pt.distanceTo(selectedPt) < thresholdPx * 3; // candidate radius
    });

    if (nearby.length <= 1) return items;

    // spread only the nearby subset, keep the rest untouched
    const angleStep = (2 * Math.PI) / nearby.length;
    const sorted = [...nearby].sort((a, b) => a.id_vehiculo - b.id_vehiculo);
    const offsetMap = new Map<number, { lat: number; lng: number }>();

    sorted.forEach((v, idx) => {
      const angle = idx * angleStep;
      const offsetPt = L.point(
        selectedPt.x + thresholdPx * Math.cos(angle),
        selectedPt.y + thresholdPx * Math.sin(angle),
      );
      offsetMap.set(v.id_vehiculo, map.containerPointToLatLng(offsetPt));
    });

    return items.map((v) =>
      offsetMap.has(v.id_vehiculo) ? { ...v, ...offsetMap.get(v.id_vehiculo)! } : v,
    );
  }, [items, map, selectedId, thresholdPx]);
}
