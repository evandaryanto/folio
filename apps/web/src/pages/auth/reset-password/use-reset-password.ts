import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authService } from "@/services/auth";
import { routes } from "@/lib/routes";

const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;

export function useResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordForm) {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword({
        token,
        password: data.password,
      });
      // Redirect to login with success message
      navigate(routes.login());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reset password. Please try again."
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
    hasToken: !!token,
    onSubmit: form.handleSubmit(onSubmit),
    handleFieldChange,
  };
}
