import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { PageService } from "@/service/page";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import { getPageResponseSchema } from "@folio/contract/page";

interface PagePublicRoutesDeps {
  pageService: PageService;
}

const pathParamsSchema = z.object({
  workspaceSlug: z.string().min(1).max(100),
  pageSlug: z.string().min(1).max(100),
});

export function createPagePublicRoutes({ pageService }: PagePublicRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // GET /:workspaceSlug/:pageSlug - Get public page by slugs
  const getPublicPageRoute = createRoute({
    method: "get",
    path: "/{workspaceSlug}/{pageSlug}",
    tags: ["Pages (Public)"],
    summary: "Get a public page by slug",
    description:
      "Retrieve a page by workspace and page slugs. No authentication required. Only active pages are returned.",
    request: {
      params: pathParamsSchema,
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
      404: {
        description: "Page or workspace not found",
      },
    },
  });

  app.openapi(getPublicPageRoute, async (c) => {
    const { workspaceSlug, pageSlug } = c.req.valid("param");
    const result = await pageService.getPublicPageBySlug(
      workspaceSlug,
      pageSlug,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
