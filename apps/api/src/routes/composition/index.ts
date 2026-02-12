import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { CompositionService } from "@/service/composition";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import {
  ulidSchema,
  cursorPaginationQuerySchema,
} from "@folio/contract/common";
import {
  createCompositionRequestSchema,
  updateCompositionRequestSchema,
  getCompositionResponseSchema,
  listCompositionsResponseSchema,
  createCompositionResponseSchema,
  updateCompositionResponseSchema,
  deleteCompositionResponseSchema,
  previewCompositionRequestSchema,
  previewCompositionResponseSchema,
} from "@folio/contract/composition";

interface CompositionRoutesDeps {
  compositionService: CompositionService;
}

const workspaceIdParamSchema = z.object({
  workspaceId: ulidSchema,
});

const compositionParamsSchema = z.object({
  workspaceId: ulidSchema,
  compositionId: ulidSchema,
});

export function createCompositionRoutes({
  compositionService,
}: CompositionRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // List Compositions
  const listCompositionsRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["Compositions"],
    request: {
      params: workspaceIdParamSchema,
      query: cursorPaginationQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listCompositionsResponseSchema,
          },
        },
        description: "List of compositions",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(listCompositionsRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const query = c.req.valid("query");
    const result = await compositionService.listCompositions(workspaceId, {
      cursor: query.cursor,
      limit: query.limit,
    });

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get Composition
  const getCompositionRoute = createRoute({
    method: "get",
    path: "/{compositionId}",
    tags: ["Compositions"],
    request: {
      params: compositionParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getCompositionResponseSchema,
          },
        },
        description: "Composition details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Composition not found",
      },
    },
  });

  app.openapi(getCompositionRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, compositionId } = c.req.valid("param");
    const result = await compositionService.getComposition(
      workspaceId,
      compositionId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get Composition by Slug
  const getCompositionBySlugRoute = createRoute({
    method: "get",
    path: "/slug/{slug}",
    tags: ["Compositions"],
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
            schema: getCompositionResponseSchema,
          },
        },
        description: "Composition details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Composition not found",
      },
    },
  });

  app.openapi(getCompositionBySlugRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, slug } = c.req.valid("param");
    const result = await compositionService.getCompositionBySlug(
      workspaceId,
      slug,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Preview Composition (test without saving)
  const previewCompositionRoute = createRoute({
    method: "post",
    path: "/preview",
    tags: ["Compositions"],
    request: {
      params: workspaceIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: previewCompositionRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: previewCompositionResponseSchema,
          },
        },
        description: "Preview results",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(previewCompositionRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await compositionService.preview(workspaceId, body);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Create Composition
  const createCompositionRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["Compositions"],
    request: {
      params: workspaceIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: createCompositionRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createCompositionResponseSchema,
          },
        },
        description: "Composition created",
      },
      401: {
        description: "Unauthorized",
      },
      409: {
        description: "Composition with this slug already exists",
      },
    },
  });

  app.openapi(createCompositionRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await compositionService.createComposition(
      workspaceId,
      body,
      userId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 201);
  });

  // Update Composition
  const updateCompositionRoute = createRoute({
    method: "put",
    path: "/{compositionId}",
    tags: ["Compositions"],
    request: {
      params: compositionParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: updateCompositionRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updateCompositionResponseSchema,
          },
        },
        description: "Composition updated",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Composition not found",
      },
    },
  });

  app.openapi(updateCompositionRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, compositionId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await compositionService.updateComposition(
      workspaceId,
      compositionId,
      body,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Delete Composition
  const deleteCompositionRoute = createRoute({
    method: "delete",
    path: "/{compositionId}",
    tags: ["Compositions"],
    request: {
      params: compositionParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: deleteCompositionResponseSchema,
          },
        },
        description: "Composition deleted",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Composition not found",
      },
    },
  });

  app.openapi(deleteCompositionRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, compositionId } = c.req.valid("param");
    const result = await compositionService.deleteComposition(
      workspaceId,
      compositionId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
