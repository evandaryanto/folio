import { api } from "./api";
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@folio/contract/auth";
import type {
  LoginResponse,
  RegisterResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  LogoutResponse,
  GetCurrentUserResponse,
} from "@folio/contract/auth";

export const authService = {
  login: (data: LoginRequest) => api.post<LoginResponse>("/auth/login", data),

  register: (data: RegisterRequest) =>
    api.post<RegisterResponse>("/auth/register", data),

  logout: () => api.post<LogoutResponse>("/auth/logout", {}),

  getMe: () => api.get<GetCurrentUserResponse>("/auth/me"),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<ForgotPasswordResponse>("/auth/forgot-password", data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<ResetPasswordResponse>("/auth/reset-password", data),
};
