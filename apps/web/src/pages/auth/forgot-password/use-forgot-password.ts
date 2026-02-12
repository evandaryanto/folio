import { useState, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { forgotPasswordRequestSchema } from "@folio/contract/auth";
import type { ForgotPasswordRequest } from "@folio/contract/auth";

import { authService } from "@/services/auth";

export function useForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordRequest) {
    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(data);
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send reset email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  function handleFieldChange(onChange: (value: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      clearError();
    };
  }

  return {
    form,
    isLoading,
    error,
    isSuccess,
    onSubmit: form.handleSubmit(onSubmit),
    handleFieldChange,
  };
}
