import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { PageService } from "@/service/page";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import { ulidSchema } from "@folio/contract/common";
import {
  createPageRequestSchema,
  updatePageRequestSchema,
  getPageResponseSchema,
  listPagesResponseSchema,
  createPageResponseSchema,
  updatePageResponseSchema,
  deletePageResponseSchema,
} from "@folio/contract/page";

interface PageRoutesDeps {
  pageService: PageService;
}

const workspaceIdParamSchema = z.object({
  workspaceId: ulidSchema,
});

const pageParamsSchema = z.object({
  workspaceId: ulidSchema,
  pageId: ulidSchema,
});

export function createPageRoutes({ pageService }: PageRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // List Pages
  const listPagesRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["Pages"],
    request: {
      params: workspaceIdParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listPagesResponseSchema,
          },
        },
        description: "List of pages",
      },
      401: {
        description: "Unauthorized",
      },
    },
  });

  app.openapi(listPagesRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const result = await pageService.listPages(workspaceId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get Page
  const getPageRoute = createRoute({
    method: "get",
    path: "/{pageId}",
    tags: ["Pages"],
    request: {
      params: pageParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getPageResponseSchema,
          },
        },
        description: "Page details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Page not found",
      },
    },
  });

  app.openapi(getPageRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, pageId } = c.req.valid("param");
    const result = await pageService.getPage(workspaceId, pageId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get Page by Slug
  const getPageBySlugRoute = createRoute({
    method: "get",
    path: "/slug/{slug}",
    tags: ["Pages"],
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
            schema: getPageResponseSchema,
          },
        },
        description: "Page details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Page not found",
      },
    },
  });

  app.openapi(getPageBySlugRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, slug } = c.req.valid("param");
    const result = await pageService.getPageBySlug(workspaceId, slug);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Create Page
  const createPageRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["Pages"],
    request: {
      params: workspaceIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: createPageRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createPageResponseSchema,
          },
        },
        description: "Page created",
      },
      401: {
        description: "Unauthorized",
      },
      409: {
        description: "Page with this slug already exists",
      },
    },
  });

  app.openapi(createPageRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await pageService.createPage(workspaceId, body, userId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 201);
  });

  // Update Page
  const updatePageRoute = createRoute({
    method: "patch",
    path: "/{pageId}",
    tags: ["Pages"],
    request: {
      params: pageParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: updatePageRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updatePageResponseSchema,
          },
        },
        description: "Page updated",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Page not found",
      },
    },
  });

  app.openapi(updatePageRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, pageId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await pageService.updatePage(workspaceId, pageId, body);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Delete Page
  const deletePageRoute = createRoute({
    method: "delete",
    path: "/{pageId}",
    tags: ["Pages"],
    request: {
      params: pageParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: deletePageResponseSchema,
          },
        },
        description: "Page deleted",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Page not found",
      },
    },
  });

  app.openapi(deletePageRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, pageId } = c.req.valid("param");
    const result = await pageService.deletePage(workspaceId, pageId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
