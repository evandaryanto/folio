import { z } from "zod";

// Login
export const loginRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

// Register
export const registerRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(255),
  workspaceName: z.string().min(1, "Workspace name is required").max(255),
  workspaceSlug: z
    .string()
    .min(3, "Workspace slug must be at least 3 characters")
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

// Refresh Token
export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;

// Logout
export const logoutRequestSchema = z.object({
  refreshToken: z.string().optional(),
});
export type LogoutRequest = z.infer<typeof logoutRequestSchema>;

// Verify Email
export const verifyEmailRequestSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

// Forgot Password
export const forgotPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

// Reset Password
export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

// Change Password
export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
