import { createContext, useContext, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useAppProvider, type UseAppProviderReturn } from "./use-app-provider";

const AppContext = createContext<UseAppProviderReturn | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const value = useAppProvider();

  // Always render the context provider so lazy-loaded components have access
  // Show loading screen as children while checking authentication
  return (
    <AppContext.Provider value={value}>
      {value.isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
}

export function useApp(): UseAppProviderReturn {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }

  return context;
}

// Re-export types
export type {
  UseAppProviderReturn,
  AppProviderState,
  AppProviderActions,
} from "./use-app-provider";
