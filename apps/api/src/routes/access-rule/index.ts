import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { AccessRuleService } from "@/service/access-rule";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import {
  ulidSchema,
  cursorPaginationQuerySchema,
} from "@folio/contract/common";
import {
  createAccessRuleRequestSchema,
  updateAccessRuleRequestSchema,
  getAccessRuleResponseSchema,
  listAccessRulesResponseSchema,
  createAccessRuleResponseSchema,
  updateAccessRuleResponseSchema,
  deleteAccessRuleResponseSchema,
} from "@folio/contract/access-rule";

interface AccessRuleRoutesDeps {
  accessRuleService: AccessRuleService;
}

const workspaceIdParamSchema = z.object({
  workspaceId: ulidSchema,
});

const accessRuleParamsSchema = z.object({
  workspaceId: ulidSchema,
  accessRuleId: ulidSchema,
});

export function createAccessRuleRoutes({
  accessRuleService,
}: AccessRuleRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // List Access Rules
  const listAccessRulesRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["Access Rules"],
    request: {
      params: workspaceIdParamSchema,
      query: cursorPaginationQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listAccessRulesResponseSchema,
          },
        },
        description: "List of access rules",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(listAccessRulesRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const query = c.req.valid("query");
    const result = await accessRuleService.listAccessRules(workspaceId, {
      cursor: query.cursor,
      limit: query.limit,
    });

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get Access Rule
  const getAccessRuleRoute = createRoute({
    method: "get",
    path: "/{accessRuleId}",
    tags: ["Access Rules"],
    request: {
      params: accessRuleParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getAccessRuleResponseSchema,
          },
        },
        description: "Access rule details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Access rule not found",
      },
    },
  });

  app.openapi(getAccessRuleRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, accessRuleId } = c.req.valid("param");
    const result = await accessRuleService.getAccessRule(
      workspaceId,
      accessRuleId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Create Access Rule
  const createAccessRuleRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["Access Rules"],
    request: {
      params: workspaceIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: createAccessRuleRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createAccessRuleResponseSchema,
          },
        },
        description: "Access rule created",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(createAccessRuleRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await accessRuleService.createAccessRule(workspaceId, body);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 201);
  });

  // Update Access Rule
  const updateAccessRuleRoute = createRoute({
    method: "put",
    path: "/{accessRuleId}",
    tags: ["Access Rules"],
    request: {
      params: accessRuleParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: updateAccessRuleRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updateAccessRuleResponseSchema,
          },
        },
        description: "Access rule updated",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Access rule not found",
      },
    },
  });

  app.openapi(updateAccessRuleRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, accessRuleId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await accessRuleService.updateAccessRule(
      workspaceId,
      accessRuleId,
      body,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Delete Access Rule
  const deleteAccessRuleRoute = createRoute({
    method: "delete",
    path: "/{accessRuleId}",
    tags: ["Access Rules"],
    request: {
      params: accessRuleParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: deleteAccessRuleResponseSchema,
          },
        },
        description: "Access rule deleted",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Access rule not found",
      },
    },
  });

  app.openapi(deleteAccessRuleRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, accessRuleId } = c.req.valid("param");
    const result = await accessRuleService.deleteAccessRule(
      workspaceId,
      accessRuleId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
