
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { FleetProvider } from '@/context/fleet-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NuqsAdapter } from 'nuqs/adapters/next/app';


export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <TooltipProvider delayDuration={0}>
          <FleetProvider>
            {children}
          </FleetProvider>
        </TooltipProvider>
      </NuqsAdapter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
