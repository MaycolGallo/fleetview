
import { ApiKeyInstructions } from '@/components/api-key-instructions';
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
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { demo, map } = await searchParams;
  const isDemoMode = demo === 'true';
  const wantsGoogleMap = map === 'google';

  // Only require a Google Maps API key when the user explicitly requests Google Maps.
  if (!apiKey && wantsGoogleMap && !isDemoMode) {
    return <ApiKeyInstructions />;
  }

  return (
    <div className="h-screen w-screen">
      <FleetViewClient apiKey={apiKey || 'MOCK_KEY'} />
    </div>
  );
}
