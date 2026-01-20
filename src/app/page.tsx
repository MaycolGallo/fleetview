import { ApiKeyInstructions } from '@/components/api-key-instructions';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const FleetViewClient = dynamic(
  () => import('@/components/fleet-view-client').then(mod => mod.FleetViewClient),
  {
    loading: () => <Skeleton className="h-full w-full" />,
  }
);

export default async function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <ApiKeyInstructions />;
  }

  return (
    <div className="h-screen w-screen">
      <FleetViewClient apiKey={apiKey} />
    </div>
  );
}
