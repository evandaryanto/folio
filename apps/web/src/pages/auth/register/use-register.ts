import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { registerRequestSchema } from "@folio/contract/auth";
import type { RegisterRequest } from "@folio/contract/auth";

import { useAuth } from "@/hooks/use-auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function useRegister() {
  const { register: registerUser, isLoading, error, clearError } = useAuth();

  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      workspaceName: "",
      workspaceSlug: "",
    },
  });

  async function onSubmit(data: RegisterRequest) {
    try {
      await registerUser(data);
    } catch {
      // Error is handled by useAuth hook
    }
  }

  function handleWorkspaceNameChange(
    value: string,
    onChange: (value: string) => void
  ) {
    onChange(value);
    form.setValue("workspaceSlug", slugify(value));
    clearError();
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
    handleWorkspaceNameChange,
    handleFieldChange,
  };
}
