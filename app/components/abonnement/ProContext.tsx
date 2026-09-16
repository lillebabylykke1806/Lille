'use client';

import { createContext, useContext, ReactNode } from 'react';

type ProContextValue = {
  hasPro: boolean;
  periodType: 'trial' | 'paid' | null;
  expiresAt: string | null;
  needsRestore: boolean;
  openPaywall: () => void;
};

const ProContext = createContext<ProContextValue>({
  hasPro: true,
  periodType: null,
  expiresAt: null,
  needsRestore: false,
  openPaywall: () => {},
});

export function ProProvider({
  value,
  children,
}: {
  value: ProContextValue;
  children: ReactNode;
}) {
  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro(): ProContextValue {
  return useContext(ProContext);
}
