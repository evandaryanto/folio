import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { SessionRepository } from "@/repository/session";

const ACCESS_TOKEN_COOKIE = "access_token";

export interface AuthContext {
  userId?: string;
  workspaceId?: string;
  sessionId?: string;
}

/**
 * Extract token from cookie or Authorization header
 */
export function extractToken(
  cookie: string | undefined,
  authHeader: string | undefined,
): string | null {
  const tokenFromCookie = cookie;
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  return tokenFromCookie || tokenFromHeader || null;
}

/**
 * Parse session ID from token (format: access_<sessionId> or access_<sessionId>_<timestamp>)
 */
export function parseSessionId(token: string): string | null {
  if (!token.startsWith("access_")) return null;
  const parts = token.split("_");
  return parts.length >= 2 ? parts[1] : null;
}

interface AuthMiddlewareDeps {
  sessionRepository: SessionRepository;
}

/**
 * Create authentication middleware that extracts and validates tokens.
 * Supports both HTTP-only cookies and Authorization header.
 * Looks up session to set userId, workspaceId, and sessionId in context.
 */
export function createAuthMiddleware({
  sessionRepository,
}: AuthMiddlewareDeps): MiddlewareHandler<{ Variables: AuthContext }> {
  return async (c, next) => {
    const token = extractToken(
      getCookie(c, ACCESS_TOKEN_COOKIE),
      c.req.header("Authorization"),
    );

    if (!token) {
      return c.json(
        { error: "Unauthorized", message: "Missing auth token" },
        401,
      );
    }

    const sessionId = parseSessionId(token);
    if (!sessionId) {
      return c.json({ error: "Unauthorized", message: "Invalid token" }, 401);
    }

    try {
      // Look up session to get userId
      const sessionResult = await sessionRepository.findById(sessionId);
      if (!sessionResult.ok) {
        return c.json(
          { error: "Unauthorized", message: "Invalid session" },
          401,
        );
      }

      const session = sessionResult.data;

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        await sessionRepository.delete(session.id);
        return c.json(
          { error: "Unauthorized", message: "Session expired" },
          401,
        );
      }

      // Set context
      c.set("sessionId", session.id);
      c.set("userId", session.userId);

      await next();
    } catch {
      return c.json(
        { error: "Unauthorized", message: "Token validation failed" },
        401,
      );
    }
  };
}

/**
 * Simple auth middleware for backwards compatibility (doesn't look up userId)
 * @deprecated Use createAuthMiddleware instead
 */
export const authMiddleware: MiddlewareHandler<{
  Variables: AuthContext;
}> = async (c, next) => {
  const token = extractToken(
    getCookie(c, ACCESS_TOKEN_COOKIE),
    c.req.header("Authorization"),
  );

  if (!token) {
    return c.json(
      { error: "Unauthorized", message: "Missing auth token" },
      401,
    );
  }

  const sessionId = parseSessionId(token);
  if (!sessionId) {
    return c.json({ error: "Unauthorized", message: "Invalid token" }, 401);
  }

  c.set("sessionId", sessionId);
  await next();
};

/**
 * Middleware to ensure a workspaceId is present in context.
 * Must be used after authMiddleware.
 */
export const requireWorkspace: MiddlewareHandler<{
  Variables: AuthContext;
}> = async (c, next) => {
  const workspaceId = c.get("workspaceId");

  if (!workspaceId) {
    return c.json(
      { error: "Forbidden", message: "Workspace context required" },
      403,
    );
  }

  await next();
};

/**
 * Middleware to extract workspace ID from path parameter and set in context.
 */
export const extractWorkspaceId: MiddlewareHandler<{
  Variables: AuthContext;
}> = async (c, next) => {
  const workspaceId = c.req.param("workspaceId");

  if (workspaceId) {
    c.set("workspaceId", workspaceId);
  }

  await next();
};
