
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const FleetViewClient = dynamic(
  () => import('@/components/fleet-view-client').then(mod => mod.FleetViewClient),
  {
    loading: () => <Skeleton className="h-full w-full" />,
  }
);

interface PageProps {
  searchParams: Promise<{ demo?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  // Leaflet map works without an API key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'leaflet-map';

  return (
    <div className="h-screen w-screen">
      <FleetViewClient apiKey={apiKey} />
    </div>
  );
}
