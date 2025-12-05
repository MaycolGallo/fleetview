import { FleetViewClient } from '@/components/fleet-view-client';
import { ApiKeyInstructions } from '@/components/api-key-instructions';
import type { Vehicle } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <ApiKeyInstructions />;
  }

  const initialVehicles: Vehicle[] = [];
  
  return <FleetViewClient initialVehicles={initialVehicles} apiKey={apiKey} />;
}
