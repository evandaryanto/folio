import { z } from "zod";
import { ulidSchema } from "../common";

// User info in auth responses
export const authUserSchema = z.object({
  id: ulidSchema,
  email: z.string().email(),
  name: z.string().nullable(),
  workspaceId: ulidSchema,
  workspaceName: z.string(),
  workspaceSlug: z.string(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

// Tokens
export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

// Login Response
export const loginResponseSchema = z.object({
  user: authUserSchema,
  tokens: authTokensSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// Register Response
export const registerResponseSchema = z.object({
  user: authUserSchema,
  tokens: authTokensSchema,
  message: z.string().optional(),
});
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

// Refresh Token Response
export const refreshTokenResponseSchema = z.object({
  tokens: authTokensSchema,
});
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;

// Logout Response
export const logoutResponseSchema = z.object({
  success: z.boolean(),
});
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

// Verify Email Response
export const verifyEmailResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type VerifyEmailResponse = z.infer<typeof verifyEmailResponseSchema>;

// Forgot Password Response
export const forgotPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ForgotPasswordResponse = z.infer<
  typeof forgotPasswordResponseSchema
>;

// Reset Password Response
export const resetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;

// Change Password Response
export const changePasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ChangePasswordResponse = z.infer<
  typeof changePasswordResponseSchema
>;

// Get Current User Response
export const getCurrentUserResponseSchema = z.object({
  user: authUserSchema,
});
export type GetCurrentUserResponse = z.infer<
  typeof getCurrentUserResponseSchema
>;
