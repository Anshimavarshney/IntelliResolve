import { createContext, useContext, type ReactNode } from 'react';
import { useSupabaseStore } from './supabase-store';

type StoreValue = ReturnType<typeof useSupabaseStore>;

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useSupabaseStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
