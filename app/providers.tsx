'use client';

import { SessionProvider } from 'next-auth/react';
import { PointsProvider } from './context/PointsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PointsProvider>
        {children}
      </PointsProvider>
    </SessionProvider>
  );
} 