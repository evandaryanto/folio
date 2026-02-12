import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { ApiKeyService } from "@/service/api-key";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import {
  ulidSchema,
  cursorPaginationQuerySchema,
} from "@folio/contract/common";
import {
  createApiKeyRequestSchema,
  updateApiKeyRequestSchema,
  getApiKeyResponseSchema,
  listApiKeysResponseSchema,
  createApiKeyResponseSchema,
  updateApiKeyResponseSchema,
  revokeApiKeyResponseSchema,
  deleteApiKeyResponseSchema,
} from "@folio/contract/api-key";

interface ApiKeyRoutesDeps {
  apiKeyService: ApiKeyService;
}

const workspaceIdParamSchema = z.object({
  workspaceId: ulidSchema,
});

const apiKeyParamsSchema = z.object({
  workspaceId: ulidSchema,
  apiKeyId: ulidSchema,
});

export function createApiKeyRoutes({ apiKeyService }: ApiKeyRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // List API Keys
  const listApiKeysRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["API Keys"],
    request: {
      params: workspaceIdParamSchema,
      query: cursorPaginationQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listApiKeysResponseSchema,
          },
        },
        description: "List of API keys",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(listApiKeysRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const query = c.req.valid("query");
    const result = await apiKeyService.listApiKeys(workspaceId, {
      cursor: query.cursor,
      limit: query.limit,
    });

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get API Key
  const getApiKeyRoute = createRoute({
    method: "get",
    path: "/{apiKeyId}",
    tags: ["API Keys"],
    request: {
      params: apiKeyParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getApiKeyResponseSchema,
          },
        },
        description: "API key details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "API key not found",
      },
    },
  });

  app.openapi(getApiKeyRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, apiKeyId } = c.req.valid("param");
    const result = await apiKeyService.getApiKey(workspaceId, apiKeyId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Create API Key
  const createApiKeyRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["API Keys"],
    request: {
      params: workspaceIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: createApiKeyRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createApiKeyResponseSchema,
          },
        },
        description: "API key created (includes raw key, only shown once)",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(createApiKeyRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await apiKeyService.createApiKey(workspaceId, body, userId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 201);
  });

  // Update API Key
  const updateApiKeyRoute = createRoute({
    method: "put",
    path: "/{apiKeyId}",
    tags: ["API Keys"],
    request: {
      params: apiKeyParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: updateApiKeyRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updateApiKeyResponseSchema,
          },
        },
        description: "API key updated",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "API key not found",
      },
    },
  });

  app.openapi(updateApiKeyRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, apiKeyId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await apiKeyService.updateApiKey(
      workspaceId,
      apiKeyId,
      body,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Revoke API Key
  const revokeApiKeyRoute = createRoute({
    method: "post",
    path: "/{apiKeyId}/revoke",
    tags: ["API Keys"],
    request: {
      params: apiKeyParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: revokeApiKeyResponseSchema,
          },
        },
        description: "API key revoked",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "API key not found",
      },
    },
  });

  app.openapi(revokeApiKeyRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, apiKeyId } = c.req.valid("param");
    const result = await apiKeyService.revokeApiKey(
      workspaceId,
      apiKeyId,
      userId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Delete API Key
  const deleteApiKeyRoute = createRoute({
    method: "delete",
    path: "/{apiKeyId}",
    tags: ["API Keys"],
    request: {
      params: apiKeyParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: deleteApiKeyResponseSchema,
          },
        },
        description: "API key deleted",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "API key not found",
      },
    },
  });

  app.openapi(deleteApiKeyRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, apiKeyId } = c.req.valid("param");
    const result = await apiKeyService.deleteApiKey(workspaceId, apiKeyId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
