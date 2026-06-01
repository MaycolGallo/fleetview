
"use client";

import { LeafletFleetMap } from './leaflet-map';

interface FleetMapProps {
  apiKey: string;
  side?: 'ida' | 'vuelta';
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

export function FleetMap({ apiKey, side, trackedVehicleIds, isOverview }: FleetMapProps) {
  // Leaflet map is now the default - no API key needed
  return (
    <LeafletFleetMap 
      side={side} 
      trackedVehicleIds={trackedVehicleIds} 
      isOverview={isOverview} 
    />
  );
}
