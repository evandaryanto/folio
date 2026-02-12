import type { AuthUsecase } from "@/usecase/auth";
import type { ServiceResult } from "@/utils/types/result";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutResponse,
  GetCurrentUserResponse,
} from "@folio/contract/auth";
import {
  toServiceError,
  toServiceSuccess,
  toServiceException,
  getStatusCode,
} from "@/utils/helpers";

interface AuthServiceDeps {
  authUsecase: AuthUsecase;
}

export class AuthService {
  private authUsecase: AuthUsecase;

  constructor({ authUsecase }: AuthServiceDeps) {
    this.authUsecase = authUsecase;
  }

  async login(input: LoginRequest): Promise<ServiceResult<LoginResponse>> {
    try {
      const result = await this.authUsecase.login(input);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Login failed");
    }
  }

  async register(
    input: RegisterRequest,
  ): Promise<ServiceResult<RegisterResponse>> {
    try {
      const result = await this.authUsecase.register(input);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Registration failed");
    }
  }

  async refreshToken(
    input: RefreshTokenRequest,
  ): Promise<ServiceResult<RefreshTokenResponse>> {
    try {
      const result = await this.authUsecase.refreshToken(input);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Token refresh failed");
    }
  }

  async logout(
    sessionId: string,
    input?: { refreshToken?: string },
  ): Promise<ServiceResult<LogoutResponse>> {
    try {
      const result = await this.authUsecase.logout(sessionId, input);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Logout failed");
    }
  }

  async getCurrentUser(
    userId: string,
  ): Promise<ServiceResult<GetCurrentUserResponse>> {
    try {
      const result = await this.authUsecase.getCurrentUser(userId);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get current user");
    }
  }

  async getCurrentUserBySession(
    sessionId: string,
  ): Promise<ServiceResult<GetCurrentUserResponse>> {
    try {
      const result = await this.authUsecase.getCurrentUserBySession(sessionId);

      if (!result.ok) {
        return toServiceError(result.error, getStatusCode(result.error.code));
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, "Failed to get current user");
    }
  }
}
