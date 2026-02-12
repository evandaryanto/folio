import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { CollectionService } from "@/service/collection";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import {
  ulidSchema,
  cursorPaginationQuerySchema,
} from "@folio/contract/common";
import {
  createCollectionRequestSchema,
  updateCollectionRequestSchema,
  getCollectionResponseSchema,
  listCollectionsResponseSchema,
  createCollectionResponseSchema,
  updateCollectionResponseSchema,
  deleteCollectionResponseSchema,
} from "@folio/contract/collection";

interface CollectionRoutesDeps {
  collectionService: CollectionService;
}

const workspaceIdParamSchema = z.object({
  workspaceId: ulidSchema,
});

const collectionParamsSchema = z.object({
  workspaceId: ulidSchema,
  collectionId: ulidSchema,
});

const collectionSlugParamsSchema = z.object({
  workspaceId: ulidSchema,
  slug: z.string().min(1),
});

export function createCollectionRoutes({
  collectionService,
}: CollectionRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // List Collections
  const listCollectionsRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["Collections"],
    request: {
      params: workspaceIdParamSchema,
      query: cursorPaginationQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listCollectionsResponseSchema,
          },
        },
        description: "List of collections",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(listCollectionsRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const query = c.req.valid("query");
    const result = await collectionService.listCollections(workspaceId, {
      cursor: query.cursor,
      limit: query.limit,
    });

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get Collection by ID
  const getCollectionRoute = createRoute({
    method: "get",
    path: "/{collectionId}",
    tags: ["Collections"],
    request: {
      params: collectionParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getCollectionResponseSchema,
          },
        },
        description: "Collection details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Collection not found",
      },
    },
  });

  app.openapi(getCollectionRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId } = c.req.valid("param");
    const result = await collectionService.getCollection(
      workspaceId,
      collectionId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get Collection by Slug
  const getCollectionBySlugRoute = createRoute({
    method: "get",
    path: "/slug/{slug}",
    tags: ["Collections"],
    request: {
      params: collectionSlugParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getCollectionResponseSchema,
          },
        },
        description: "Collection details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Collection not found",
      },
    },
  });

  app.openapi(getCollectionBySlugRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, slug } = c.req.valid("param");
    const result = await collectionService.getCollectionBySlug(
      workspaceId,
      slug,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Create Collection
  const createCollectionRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["Collections"],
    request: {
      params: workspaceIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: createCollectionRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createCollectionResponseSchema,
          },
        },
        description: "Collection created",
      },
      401: {
        description: "Unauthorized",
      },
      409: {
        description: "Collection slug already exists",
      },
    },
  });

  app.openapi(createCollectionRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await collectionService.createCollection(
      workspaceId,
      body,
      userId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 201);
  });

  // Update Collection
  const updateCollectionRoute = createRoute({
    method: "patch",
    path: "/{collectionId}",
    tags: ["Collections"],
    request: {
      params: collectionParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: updateCollectionRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updateCollectionResponseSchema,
          },
        },
        description: "Collection updated",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Collection not found",
      },
    },
  });

  app.openapi(updateCollectionRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await collectionService.updateCollection(
      workspaceId,
      collectionId,
      body,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Delete Collection
  const deleteCollectionRoute = createRoute({
    method: "delete",
    path: "/{collectionId}",
    tags: ["Collections"],
    request: {
      params: collectionParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: deleteCollectionResponseSchema,
          },
        },
        description: "Collection deleted",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Collection not found",
      },
    },
  });

  app.openapi(deleteCollectionRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId } = c.req.valid("param");
    const result = await collectionService.deleteCollection(
      workspaceId,
      collectionId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
