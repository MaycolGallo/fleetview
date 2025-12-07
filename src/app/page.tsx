import { FleetViewLoader } from '@/components/fleet-view-loader';
import { ApiKeyInstructions } from '@/components/api-key-instructions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <ApiKeyInstructions />;
  }
  
  return <FleetViewLoader apiKey={apiKey} />;
}
