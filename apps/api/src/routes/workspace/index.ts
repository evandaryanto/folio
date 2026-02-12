import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { WorkspaceService } from "@/service/workspace";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import {
  ulidSchema,
  cursorPaginationQuerySchema,
} from "@folio/contract/common";
import {
  updateWorkspaceRequestSchema,
  getWorkspaceResponseSchema,
  listWorkspacesResponseSchema,
  updateWorkspaceResponseSchema,
  deleteWorkspaceResponseSchema,
} from "@folio/contract/workspace";

interface WorkspaceRoutesDeps {
  workspaceService: WorkspaceService;
}

const workspaceIdParamSchema = z.object({
  workspaceId: ulidSchema,
});

export function createWorkspaceRoutes({
  workspaceService,
}: WorkspaceRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // List Workspaces
  const listWorkspacesRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["Workspaces"],
    request: {
      query: cursorPaginationQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listWorkspacesResponseSchema,
          },
        },
        description: "List of workspaces",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(listWorkspacesRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const query = c.req.valid("query");
    const result = await workspaceService.listWorkspaces(userId, {
      cursor: query.cursor,
      limit: query.limit,
    });

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get Workspace
  const getWorkspaceRoute = createRoute({
    method: "get",
    path: "/{workspaceId}",
    tags: ["Workspaces"],
    request: {
      params: workspaceIdParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getWorkspaceResponseSchema,
          },
        },
        description: "Workspace details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Workspace not found",
      },
    },
  });

  app.openapi(getWorkspaceRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const result = await workspaceService.getWorkspace(workspaceId, userId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Update Workspace
  const updateWorkspaceRoute = createRoute({
    method: "put",
    path: "/{workspaceId}",
    tags: ["Workspaces"],
    request: {
      params: workspaceIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: updateWorkspaceRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updateWorkspaceResponseSchema,
          },
        },
        description: "Workspace updated",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Workspace not found",
      },
    },
  });

  app.openapi(updateWorkspaceRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await workspaceService.updateWorkspace(
      workspaceId,
      body,
      userId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Delete Workspace
  const deleteWorkspaceRoute = createRoute({
    method: "delete",
    path: "/{workspaceId}",
    tags: ["Workspaces"],
    request: {
      params: workspaceIdParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: deleteWorkspaceResponseSchema,
          },
        },
        description: "Workspace deleted",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Workspace not found",
      },
    },
  });

  app.openapi(deleteWorkspaceRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const result = await workspaceService.deleteWorkspace(workspaceId, userId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
