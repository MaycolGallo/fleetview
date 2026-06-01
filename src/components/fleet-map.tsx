
"use client";

import dynamic from 'next/dynamic';

const DynamicLeafletFleetMap = dynamic(
  () => import('./leaflet-map').then(mod => mod.LeafletFleetMap),
  {
    ssr: false,
  }
);

interface FleetMapProps {
  apiKey: string;
  side?: 'ida' | 'vuelta';
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

export function FleetMap({ apiKey, side, trackedVehicleIds, isOverview }: FleetMapProps) {
  return (
    <DynamicLeafletFleetMap 
      trackedVehicleIds={trackedVehicleIds} 
      isOverview={isOverview} 
    />
  );
}
