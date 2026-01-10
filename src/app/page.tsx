import { FleetViewClient } from '@/components/fleet-view-client';
import { ApiKeyInstructions } from '@/components/api-key-instructions';

export default async function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <ApiKeyInstructions />;
  }
  
  return (
    <div className='h-screen w-screen'>
      <FleetViewClient apiKey={apiKey} />
    </div>
  );
}
