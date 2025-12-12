
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { FleetProvider } from '@/context/fleet-context';
import { Skeleton } from './ui/skeleton';


export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
        <FleetProvider>
          {children}
        </FleetProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
