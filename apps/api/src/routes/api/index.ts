import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { ApiService } from "@/service/api";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import {
  ulidSchema,
  cursorPaginationQuerySchema,
} from "@folio/contract/common";
import {
  createApiRequestSchema,
  updateApiRequestSchema,
  getApiResponseSchema,
  listApisResponseSchema,
  createApiResponseSchema,
  updateApiResponseSchema,
  deleteApiResponseSchema,
} from "@folio/contract/api";

interface ApiRoutesDeps {
  apiService: ApiService;
}

const workspaceIdParamSchema = z.object({
  workspaceId: ulidSchema,
});

const apiParamsSchema = z.object({
  workspaceId: ulidSchema,
  apiId: ulidSchema,
});

export function createApiRoutes({ apiService }: ApiRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // List APIs
  const listApisRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["APIs"],
    request: {
      params: workspaceIdParamSchema,
      query: cursorPaginationQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listApisResponseSchema,
          },
        },
        description: "List of APIs",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(listApisRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const query = c.req.valid("query");
    const result = await apiService.listApis(workspaceId, {
      cursor: query.cursor,
      limit: query.limit,
    });

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get API
  const getApiRoute = createRoute({
    method: "get",
    path: "/{apiId}",
    tags: ["APIs"],
    request: {
      params: apiParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getApiResponseSchema,
          },
        },
        description: "API details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "API not found",
      },
    },
  });

  app.openapi(getApiRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, apiId } = c.req.valid("param");
    const result = await apiService.getApi(workspaceId, apiId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Create API
  const createApiRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["APIs"],
    request: {
      params: workspaceIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: createApiRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createApiResponseSchema,
          },
        },
        description: "API created",
      },
      401: {
        description: "Unauthorized",
      },
      409: {
        description: "API with this slug and method already exists",
      },
    },
  });

  app.openapi(createApiRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await apiService.createApi(workspaceId, body, userId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 201);
  });

  // Update API
  const updateApiRoute = createRoute({
    method: "put",
    path: "/{apiId}",
    tags: ["APIs"],
    request: {
      params: apiParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: updateApiRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updateApiResponseSchema,
          },
        },
        description: "API updated",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "API not found",
      },
    },
  });

  app.openapi(updateApiRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, apiId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await apiService.updateApi(workspaceId, apiId, body);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Delete API
  const deleteApiRoute = createRoute({
    method: "delete",
    path: "/{apiId}",
    tags: ["APIs"],
    request: {
      params: apiParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: deleteApiResponseSchema,
          },
        },
        description: "API deleted",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "API not found",
      },
    },
  });

  app.openapi(deleteApiRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, apiId } = c.req.valid("param");
    const result = await apiService.deleteApi(workspaceId, apiId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
