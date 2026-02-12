import { useState } from "react";
import { Link } from "react-router-dom";
import { Controller } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useRegister } from "./use-register";

export default function RegisterPage() {
  const {
    form,
    isLoading,
    error,
    onSubmit,
    handleWorkspaceNameChange,
    handleFieldChange,
  } = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Get started with Folio in seconds</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="register-form" onSubmit={onSubmit}>
          <FieldGroup>
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-name">Full Name</FieldLabel>
                  <Input
                    {...field}
                    id="register-name"
                    placeholder="John Doe"
                    aria-invalid={fieldState.invalid}
                    disabled={isLoading}
                    onChange={handleFieldChange(field.onChange)}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* Email */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="register-email"
                    type="email"
                    placeholder="john@example.com"
                    aria-invalid={fieldState.invalid}
                    disabled={isLoading}
                    onChange={handleFieldChange(field.onChange)}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* Password */}
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      aria-invalid={fieldState.invalid}
                      disabled={isLoading}
                      className="pr-10"
                      onChange={handleFieldChange(field.onChange)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Workspace
                </span>
              </div>
            </div>

            {/* Workspace Name */}
            <Controller
              name="workspaceName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-workspace-name">
                    Workspace Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="register-workspace-name"
                    placeholder="Acme Corp"
                    aria-invalid={fieldState.invalid}
                    disabled={isLoading}
                    onChange={(e) =>
                      handleWorkspaceNameChange(e.target.value, field.onChange)
                    }
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* Workspace Slug */}
            <Controller
              name="workspaceSlug"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-workspace-slug">
                    Workspace URL
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupText>folio.dev/</InputGroupText>
                    <InputGroupInput
                      {...field}
                      id="register-workspace-slug"
                      placeholder="acme-corp"
                      aria-invalid={fieldState.invalid}
                      disabled={isLoading}
                      onChange={handleFieldChange(field.onChange)}
                    />
                  </InputGroup>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button
          type="submit"
          form="register-form"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to={routes.login()}
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
