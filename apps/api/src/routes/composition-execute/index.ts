import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { CompositionService } from "@/service/composition";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import { executeCompositionResponseSchema } from "@folio/contract/composition";

interface CompositionExecuteRoutesDeps {
  compositionService: CompositionService;
}

const pathParamsSchema = z.object({
  workspaceSlug: z.string().min(1).max(100),
  compositionSlug: z.string().min(1).max(100),
});

export function createCompositionExecuteRoutes({
  compositionService,
}: CompositionExecuteRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // GET /:workspaceSlug/:compositionSlug - Execute with query params
  const getExecuteRoute = createRoute({
    method: "get",
    path: "/{workspaceSlug}/{compositionSlug}",
    tags: ["Composition Execution"],
    summary: "Execute a composition (GET)",
    description:
      "Execute a composition with parameters passed as query strings. Suitable for simple queries and caching.",
    request: {
      params: pathParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: executeCompositionResponseSchema,
          },
        },
        description: "Composition execution result",
      },
      400: {
        description: "Invalid parameters or query builder error",
      },
      401: {
        description: "Authentication required (for internal compositions)",
      },
      403: {
        description: "Composition is private or inactive",
      },
      404: {
        description: "Workspace or composition not found",
      },
    },
  });

  app.openapi(getExecuteRoute, async (c) => {
    const { workspaceSlug, compositionSlug } = c.req.valid("param");
    const queryParams = c.req.query();

    // Extract userId if authenticated (optional for public compositions)
    const userId = c.get("userId");

    const result = await compositionService.execute(
      workspaceSlug,
      compositionSlug,
      queryParams,
      userId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // POST /:workspaceSlug/:compositionSlug - Execute with body params
  const postExecuteRoute = createRoute({
    method: "post",
    path: "/{workspaceSlug}/{compositionSlug}",
    tags: ["Composition Execution"],
    summary: "Execute a composition (POST)",
    description:
      "Execute a composition with complex parameters in request body. Suitable for 'in' filters with arrays.",
    request: {
      params: pathParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: z
              .object({
                params: z.record(z.string(), z.unknown()).optional(),
              })
              .optional(),
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: executeCompositionResponseSchema,
          },
        },
        description: "Composition execution result",
      },
      400: {
        description: "Invalid parameters or query builder error",
      },
      401: {
        description: "Authentication required (for internal compositions)",
      },
      403: {
        description: "Composition is private or inactive",
      },
      404: {
        description: "Workspace or composition not found",
      },
    },
  });

  app.openapi(postExecuteRoute, async (c) => {
    const { workspaceSlug, compositionSlug } = c.req.valid("param");
    const body = c.req.valid("json");
    const userId = c.get("userId");

    const result = await compositionService.execute(
      workspaceSlug,
      compositionSlug,
      body?.params ?? {},
      userId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
