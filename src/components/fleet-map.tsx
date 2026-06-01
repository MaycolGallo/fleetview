
'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const LeafletMap = dynamic(
  () => import('./leaflet-map').then((mod) => mod.LeafletMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  }
);

const FleetMapGoogle = dynamic(
  () => import('./fleet-map-google').then((mod) => mod.FleetMapGoogle),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  }
);

interface FleetMapProps {
  apiKey: string;
  side?: 'ida' | 'vuelta';
  trackedVehicleIds?: number[];
  isOverview?: boolean;
}

export function FleetMap({ apiKey, side, trackedVehicleIds, isOverview }: FleetMapProps) {
  const searchParams = useSearchParams();
  const provider = searchParams.get('map') === 'google' ? 'google' : 'leaflet';
  const trackedVehicleIdsKey = trackedVehicleIds?.slice().sort((a, b) => a - b).join(',') || 'all';
  const mapProviderKey = `${provider}-${isOverview ? 'overview' : 'main'}-${side ?? 'all'}-${trackedVehicleIdsKey}`;

  if (provider === 'google') {
    return (
      <FleetMapGoogle
        key={`google-${mapProviderKey}`}
        apiKey={apiKey}
        side={side}
        trackedVehicleIds={trackedVehicleIds}
        isOverview={isOverview}
      />
    );
  }

  return (
    <LeafletMap
      key={`leaflet-${mapProviderKey}`}
      apiKey={apiKey}
      side={side}
      trackedVehicleIds={trackedVehicleIds}
      isOverview={isOverview}
    />
  );
}
