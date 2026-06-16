
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const FleetViewClient = dynamic(
  () => import('@/components/fleet-view-client'),
  {
    loading: () => <Skeleton className="h-full w-full" />,
  }
);

interface PageProps {
  searchParams: Promise<{ demo?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { demo } = await searchParams;
  const isDemoMode = demo === 'true';

  // No need to show API key instructions anymore - Leaflet is the default and works without an API key
  // Only show the page if we can proceed (Leaflet doesn't require an API key)

  return (
    <div className="h-screen w-screen">
      <FleetViewClient apiKey={apiKey || 'MOCK_KEY'} />
    </div>
  );
}
