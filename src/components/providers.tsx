
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { FleetProvider } from '@/context/fleet-context';
import { FirebaseClientProvider, useAuth, useFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Skeleton } from './ui/skeleton';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useFirebase();
  const auth = useAuth();

  React.useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  if (isUserLoading || !user) {
     return <div className="h-screen w-screen bg-background flex items-center justify-center"><Skeleton className="h-full w-full" /></div>;
  }

  return <>{children}</>;
}


export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseClientProvider>
        <AuthGate>
          <FleetProvider>
            {children}
          </FleetProvider>
        </AuthGate>
      </FirebaseClientProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
