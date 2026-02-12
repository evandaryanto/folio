import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import type { AuthService } from "@/service/auth";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import {
  loginRequestSchema,
  loginResponseSchema,
  registerRequestSchema,
  registerResponseSchema,
  refreshTokenRequestSchema,
  refreshTokenResponseSchema,
  logoutResponseSchema,
  getCurrentUserResponseSchema,
} from "@folio/contract/auth";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  domain:
    process.env.NODE_ENV === "production" ? ".folio.com" : "local.folio.com",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

interface AuthRoutesDeps {
  authService: AuthService;
}

export function createAuthRoutes({ authService }: AuthRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // Login
  const loginRoute = createRoute({
    method: "post",
    path: "/login",
    tags: ["Auth"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: loginRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: loginResponseSchema,
          },
        },
        description: "Login successful",
      },
      401: {
        description: "Invalid credentials",
      },
    },
  });

  app.openapi(loginRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await authService.login(body);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    // Set HTTP-only cookies for tokens
    setCookie(
      c,
      ACCESS_TOKEN_COOKIE,
      result.data.tokens.accessToken,
      COOKIE_OPTIONS,
    );
    setCookie(c, REFRESH_TOKEN_COOKIE, result.data.tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
    });

    return c.json(result.data, 200);
  });

  // Register
  const registerRoute = createRoute({
    method: "post",
    path: "/register",
    tags: ["Auth"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: registerRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: registerResponseSchema,
          },
        },
        description: "Registration successful",
      },
      409: {
        description: "Email or company slug already exists",
      },
    },
  });

  app.openapi(registerRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await authService.register(body);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    // Set HTTP-only cookies for tokens
    setCookie(
      c,
      ACCESS_TOKEN_COOKIE,
      result.data.tokens.accessToken,
      COOKIE_OPTIONS,
    );
    setCookie(c, REFRESH_TOKEN_COOKIE, result.data.tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
    });

    return c.json(result.data, 201);
  });

  // Refresh Token
  const refreshTokenRoute = createRoute({
    method: "post",
    path: "/refresh",
    tags: ["Auth"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: refreshTokenRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: refreshTokenResponseSchema,
          },
        },
        description: "Token refreshed successfully",
      },
      401: {
        description: "Invalid or expired refresh token",
      },
    },
  });

  app.openapi(refreshTokenRoute, async (c) => {
    // Try to get refresh token from cookie first, then from body
    const refreshTokenFromCookie = getCookie(c, REFRESH_TOKEN_COOKIE);
    const body = c.req.valid("json");
    const refreshToken = refreshTokenFromCookie || body.refreshToken;

    const result = await authService.refreshToken({ refreshToken });

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    // Update cookies with new tokens
    setCookie(
      c,
      ACCESS_TOKEN_COOKIE,
      result.data.tokens.accessToken,
      COOKIE_OPTIONS,
    );
    setCookie(c, REFRESH_TOKEN_COOKIE, result.data.tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
    });

    return c.json(result.data, 200);
  });

  // Logout
  const logoutRoute = createRoute({
    method: "post",
    path: "/logout",
    tags: ["Auth"],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: logoutResponseSchema,
          },
        },
        description: "Logout successful",
      },
    },
  });

  app.openapi(logoutRoute, async (c) => {
    const sessionId = c.get("sessionId");

    // Clear cookies regardless of session
    deleteCookie(c, ACCESS_TOKEN_COOKIE, COOKIE_OPTIONS);
    deleteCookie(c, REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS);

    if (!sessionId) {
      return c.json({ success: true }, 200);
    }

    const result = await authService.logout(sessionId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get Current User
  const getCurrentUserRoute = createRoute({
    method: "get",
    path: "/me",
    tags: ["Auth"],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getCurrentUserResponseSchema,
          },
        },
        description: "Current user info",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(getCurrentUserRoute, async (c) => {
    const sessionId = c.get("sessionId");

    if (!sessionId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const result = await authService.getCurrentUserBySession(sessionId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
