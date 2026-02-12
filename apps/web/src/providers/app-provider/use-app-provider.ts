import { useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

import type { AuthUser } from "@folio/contract/auth";

import { authService } from "@/services/auth";
import { routes, ROUTES } from "@/lib/routes";

// Query keys
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route);
}

export interface AppProviderState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AppProviderActions {
  logout: () => void;
  refreshUser: () => void;
}

export type UseAppProviderReturn = AppProviderState & AppProviderActions;

export function useAppProvider(): UseAppProviderReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Fetch current user with React Query
  // Authentication is handled via HTTP-only cookies
  const {
    data: user,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      try {
        const response = await authService.getMe();
        return response.user;
      } catch {
        // Not authenticated or token is invalid/expired
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const isAuthenticated = user !== null;
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to fetch user data"
    : null;

  // Logout mutation
  // Server clears HTTP-only cookies on logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authService.logout();
      } catch {
        // Ignore logout errors
      }
    },
    onSettled: () => {
      queryClient.setQueryData(authKeys.user(), null);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      navigate(routes.login());
    },
  });

  // Logout handler
  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  // Refresh user data
  const refreshUser = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: authKeys.user() });
  }, [queryClient]);

  // Handle route protection
  useEffect(() => {
    if (isLoading) return;

    const isPublic = isPublicRoute(location.pathname);

    if (!isAuthenticated && !isPublic) {
      // Redirect to login if not authenticated and trying to access protected route
      navigate(routes.login(), { replace: true });
    } else if (isAuthenticated && isPublic) {
      // Redirect to app if authenticated and trying to access auth pages
      navigate(routes.overview(), { replace: true });
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated,
    error,
    logout,
    refreshUser,
  };
}
