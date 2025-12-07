"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const FleetViewClient = dynamic(
  () => import('./fleet-view-client').then(mod => mod.FleetViewClient),
  {
    ssr: false,
    loading: () => <div className="h-screen w-screen bg-background flex items-center justify-center"><Skeleton className="h-full w-full" /></div>
  }
);

export function FleetViewLoader({ apiKey }: { apiKey: string }) {
  return <FleetViewClient apiKey={apiKey} />;
}
