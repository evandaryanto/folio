import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { routes } from "@/lib/routes";
import { authService } from "@/services/auth";
import { authKeys } from "@/providers/app-provider/use-app-provider";
import type { LoginRequest, RegisterRequest } from "@folio/contract/auth";

interface UseAuthReturn {
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Login mutation
  // Tokens are stored in HTTP-only cookies by the server
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (result) => {
      // Set user data in cache
      queryClient.setQueryData(authKeys.user(), result.user);
      // Navigate to app
      navigate(routes.overview());
    },
  });

  // Register mutation
  // Tokens are stored in HTTP-only cookies by the server
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (result) => {
      // Set user data in cache
      queryClient.setQueryData(authKeys.user(), result.user);
      // Navigate to app
      navigate(routes.overview());
    },
  });

  // Login handler - returns promise for proper error handling in forms
  const login = useCallback(
    async (data: LoginRequest) => {
      await loginMutation.mutateAsync(data);
    },
    [loginMutation],
  );

  // Register handler - returns promise for proper error handling in forms
  const register = useCallback(
    async (data: RegisterRequest) => {
      await registerMutation.mutateAsync(data);
    },
    [registerMutation],
  );

  // Clear error
  const clearError = useCallback(() => {
    loginMutation.reset();
    registerMutation.reset();
  }, [loginMutation, registerMutation]);

  // Determine loading and error state from active mutation
  const isLoading = loginMutation.isPending || registerMutation.isPending;
  const error = loginMutation.error
    ? loginMutation.error instanceof Error
      ? loginMutation.error.message
      : "Login failed. Please try again."
    : registerMutation.error
      ? registerMutation.error instanceof Error
        ? registerMutation.error.message
        : "Registration failed. Please try again."
      : null;

  return {
    isLoading,
    error,
    login,
    register,
    clearError,
  };
}
