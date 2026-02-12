import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { ViewService } from "@/service/view";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import { ulidSchema } from "@folio/contract/common";
import {
  createViewRequestSchema,
  updateViewRequestSchema,
  getViewResponseSchema,
  listViewsResponseSchema,
  createViewResponseSchema,
  updateViewResponseSchema,
  deleteViewResponseSchema,
} from "@folio/contract/view";

interface ViewRoutesDeps {
  viewService: ViewService;
}

const workspaceIdParamSchema = z.object({
  workspaceId: ulidSchema,
});

const viewParamsSchema = z.object({
  workspaceId: ulidSchema,
  viewId: ulidSchema,
});

export function createViewRoutes({ viewService }: ViewRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // List Views
  const listViewsRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["Views"],
    request: {
      params: workspaceIdParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listViewsResponseSchema,
          },
        },
        description: "List of views",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(listViewsRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const result = await viewService.listViews(workspaceId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get View
  const getViewRoute = createRoute({
    method: "get",
    path: "/{viewId}",
    tags: ["Views"],
    request: {
      params: viewParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getViewResponseSchema,
          },
        },
        description: "View details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "View not found",
      },
    },
  });

  app.openapi(getViewRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, viewId } = c.req.valid("param");
    const result = await viewService.getView(workspaceId, viewId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get View by Slug
  const getViewBySlugRoute = createRoute({
    method: "get",
    path: "/slug/{slug}",
    tags: ["Views"],
    request: {
      params: z.object({
        workspaceId: ulidSchema,
        slug: z.string(),
      }),
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getViewResponseSchema,
          },
        },
        description: "View details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "View not found",
      },
    },
  });

  app.openapi(getViewBySlugRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, slug } = c.req.valid("param");
    const result = await viewService.getViewBySlug(workspaceId, slug);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Create View
  const createViewRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["Views"],
    request: {
      params: workspaceIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: createViewRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createViewResponseSchema,
          },
        },
        description: "View created",
      },
      401: {
        description: "Unauthorized",
      },
      409: {
        description: "View with this slug already exists",
      },
    },
  });

  app.openapi(createViewRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await viewService.createView(workspaceId, body, userId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 201);
  });

  // Update View
  const updateViewRoute = createRoute({
    method: "put",
    path: "/{viewId}",
    tags: ["Views"],
    request: {
      params: viewParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: updateViewRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updateViewResponseSchema,
          },
        },
        description: "View updated",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "View not found",
      },
    },
  });

  app.openapi(updateViewRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, viewId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await viewService.updateView(workspaceId, viewId, body);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Delete View
  const deleteViewRoute = createRoute({
    method: "delete",
    path: "/{viewId}",
    tags: ["Views"],
    request: {
      params: viewParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: deleteViewResponseSchema,
          },
        },
        description: "View deleted",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "View not found",
      },
    },
  });

  app.openapi(deleteViewRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, viewId } = c.req.valid("param");
    const result = await viewService.deleteView(workspaceId, viewId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
