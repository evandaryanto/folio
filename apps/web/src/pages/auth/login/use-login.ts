import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { loginRequestSchema } from "@folio/contract/auth";
import type { LoginRequest } from "@folio/contract/auth";

import { useAuth } from "@/hooks/use-auth";

export function useLogin() {
  const { login, isLoading, error, clearError } = useAuth();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginRequest) {
    try {
      await login(data);
    } catch {
      // Error is handled by useAuth hook
    }
  }

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
    onSubmit: form.handleSubmit(onSubmit),
    handleFieldChange,
  };
}
