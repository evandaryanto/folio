import { createHash, randomBytes } from "crypto";
import type { UserRepository } from "@/repository/user";
import type { WorkspaceRepository } from "@/repository/workspace";
import type { SessionRepository } from "@/repository/session";
import type { Logger } from "@/utils/logger";
import type { ResponseResult } from "@/utils/types/result";
import type { TransactionWrapper } from "@/client/postgres/transaction";
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
import { ErrorCode } from "@/utils/errors/common";
import { ok, err, createError } from "@/utils/types/result";

interface AuthUsecaseDeps {
  userRepository: UserRepository;
  workspaceRepository: WorkspaceRepository;
  sessionRepository: SessionRepository;
  txWrapper: TransactionWrapper;
  logger: Logger;
}

export class AuthUsecase {
  private userRepo: UserRepository;
  private workspaceRepo: WorkspaceRepository;
  private sessionRepo: SessionRepository;
  private txWrapper: TransactionWrapper;
  private logger: Logger;

  constructor({
    userRepository,
    workspaceRepository,
    sessionRepository,
    txWrapper,
    logger,
  }: AuthUsecaseDeps) {
    this.userRepo = userRepository;
    this.workspaceRepo = workspaceRepository;
    this.sessionRepo = sessionRepository;
    this.txWrapper = txWrapper;
    this.logger = logger;
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString("hex");
  }

  private hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async login(input: LoginRequest): Promise<ResponseResult<LoginResponse>> {
    try {
      // Find user by email
      const userResult = await this.userRepo.findByEmail(input.email);
      if (!userResult.ok) {
        return err(
          createError(ErrorCode.Unauthorized, "Invalid email or password"),
        );
      }

      const user = userResult.data;

      // Verify password (placeholder - implement actual password verification)
      // In production, use bcrypt.compare(input.password, user.passwordHash)
      if (!user.passwordHash) {
        return err(
          createError(ErrorCode.Unauthorized, "Invalid email or password"),
        );
      }

      // Get workspace info
      const workspaceResult = await this.workspaceRepo.findById(
        user.workspaceId,
      );
      if (!workspaceResult.ok) {
        return err(createError(ErrorCode.NotFound, "Workspace not found"));
      }

      const workspace = workspaceResult.data;

      // Generate refresh token
      const refreshToken = this.generateRefreshToken();
      const refreshTokenHash = this.hashRefreshToken(refreshToken);

      // Create session
      const sessionResult = await this.sessionRepo.create({
        userId: user.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: null,
        ipAddress: null,
      });

      if (!sessionResult.ok) {
        return err(sessionResult.error);
      }

      const session = sessionResult.data;

      // Generate access token (placeholder - implement JWT generation)
      const accessToken = `access_${session.id}`;

      return ok({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: user.workspaceId,
          workspaceName: workspace.name,
          workspaceSlug: workspace.slug,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour
        },
      });
    } catch (e) {
      this.logger.error("Login failed", { error: e, email: input.email });
      return err(createError(ErrorCode.InternalError, "Login failed"));
    }
  }

  async register(
    input: RegisterRequest,
  ): Promise<ResponseResult<RegisterResponse>> {
    try {
      // Check if workspace slug and email exist in parallel (outside transaction)
      const [existingWorkspace, existingUser] = await Promise.all([
        this.workspaceRepo.findBySlug(input.workspaceSlug),
        this.userRepo.findByEmail(input.email),
      ]);

      if (existingWorkspace.ok) {
        return err(
          createError(ErrorCode.AlreadyExists, "Workspace slug already exists"),
        );
      }

      if (existingUser.ok) {
        return err(
          createError(ErrorCode.AlreadyExists, "Email already registered"),
        );
      }

      // Generate refresh token before transaction
      const refreshToken = this.generateRefreshToken();
      const refreshTokenHash = this.hashRefreshToken(refreshToken);

      // Atomic transaction: create workspace, user, and session
      return await this.txWrapper(async (tx) => {
        // Create workspace
        const workspaceResult = await this.workspaceRepo.create(
          {
            name: input.workspaceName,
            slug: input.workspaceSlug,
            settings: {
              timezone: "UTC",
              locale: "en-US",
            },
          },
          tx,
        );

        if (!workspaceResult.ok) {
          throw new Error(workspaceResult.error.message);
        }

        const workspace = workspaceResult.data;

        // Create user
        // In production, hash password with bcrypt
        const userResult = await this.userRepo.create(
          {
            workspaceId: workspace.id,
            email: input.email,
            passwordHash: input.password, // TODO: Hash with bcrypt
            name: input.name,
            isActive: true,
          },
          tx,
        );

        if (!userResult.ok) {
          throw new Error(userResult.error.message);
        }

        const user = userResult.data;

        // Create session
        const sessionResult = await this.sessionRepo.create(
          {
            userId: user.id,
            refreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            userAgent: null,
            ipAddress: null,
          },
          tx,
        );

        if (!sessionResult.ok) {
          throw new Error(sessionResult.error.message);
        }

        const session = sessionResult.data;

        return ok({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            workspaceId: user.workspaceId,
            workspaceName: workspace.name,
            workspaceSlug: workspace.slug,
          },
          tokens: {
            accessToken: `access_${session.id}`,
            refreshToken,
            expiresIn: 3600,
          },
          message: "Registration successful",
        });
      });
    } catch (e) {
      this.logger.error("Registration failed", {
        error: e,
        email: input.email,
      });
      return err(createError(ErrorCode.InternalError, "Registration failed"));
    }
  }

  async refreshToken(
    input: RefreshTokenRequest,
  ): Promise<ResponseResult<RefreshTokenResponse>> {
    try {
      const refreshTokenHash = this.hashRefreshToken(input.refreshToken);
      const sessionResult =
        await this.sessionRepo.findByRefreshTokenHash(refreshTokenHash);

      if (!sessionResult.ok) {
        return err(
          createError(ErrorCode.Unauthorized, "Invalid refresh token"),
        );
      }

      const session = sessionResult.data;

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        await this.sessionRepo.delete(session.id);
        return err(createError(ErrorCode.Expired, "Session expired"));
      }

      // Generate new access token
      const newAccessToken = `access_${session.id}_${Date.now()}`;

      return ok({
        tokens: {
          accessToken: newAccessToken,
          refreshToken: input.refreshToken,
          expiresIn: 3600,
        },
      });
    } catch (e) {
      this.logger.error("Token refresh failed", { error: e });
      return err(createError(ErrorCode.InternalError, "Token refresh failed"));
    }
  }

  async logout(
    sessionId: string,
    _input?: { refreshToken?: string },
  ): Promise<ResponseResult<LogoutResponse>> {
    try {
      await this.sessionRepo.delete(sessionId);

      return ok({
        success: true,
      });
    } catch (e) {
      this.logger.error("Logout failed", { error: e, sessionId });
      return err(createError(ErrorCode.InternalError, "Logout failed"));
    }
  }

  async getCurrentUser(
    userId: string,
  ): Promise<ResponseResult<GetCurrentUserResponse>> {
    try {
      const userResult = await this.userRepo.findById(userId);
      if (!userResult.ok) {
        return err(createError(ErrorCode.NotFound, "User not found"));
      }

      const user = userResult.data;

      const workspaceResult = await this.workspaceRepo.findById(
        user.workspaceId,
      );
      if (!workspaceResult.ok) {
        return err(createError(ErrorCode.NotFound, "Workspace not found"));
      }

      const workspace = workspaceResult.data;

      return ok({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: user.workspaceId,
          workspaceName: workspace.name,
          workspaceSlug: workspace.slug,
        },
      });
    } catch (e) {
      this.logger.error("Get current user failed", { error: e, userId });
      return err(
        createError(ErrorCode.InternalError, "Failed to get current user"),
      );
    }
  }

  async getCurrentUserBySession(
    sessionId: string,
  ): Promise<ResponseResult<GetCurrentUserResponse>> {
    try {
      // Find session
      const sessionResult = await this.sessionRepo.findById(sessionId);
      if (!sessionResult.ok) {
        return err(createError(ErrorCode.Unauthorized, "Invalid session"));
      }

      const session = sessionResult.data;

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        await this.sessionRepo.delete(session.id);
        return err(createError(ErrorCode.Unauthorized, "Session expired"));
      }

      // Get user
      return this.getCurrentUser(session.userId);
    } catch (e) {
      this.logger.error("Get current user by session failed", {
        error: e,
        sessionId,
      });
      return err(
        createError(ErrorCode.InternalError, "Failed to get current user"),
      );
    }
  }
}
