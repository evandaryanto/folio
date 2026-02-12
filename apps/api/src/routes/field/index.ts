import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { FieldService } from "@/service/field";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import { ulidSchema } from "@folio/contract/common";
import {
  createFieldRequestSchema,
  updateFieldRequestSchema,
  getFieldResponseSchema,
  listFieldsResponseSchema,
  createFieldResponseSchema,
  updateFieldResponseSchema,
  deleteFieldResponseSchema,
} from "@folio/contract/field";

interface FieldRoutesDeps {
  fieldService: FieldService;
}

const collectionParamsSchema = z.object({
  workspaceId: ulidSchema,
  collectionId: ulidSchema,
});

const fieldParamsSchema = z.object({
  workspaceId: ulidSchema,
  collectionId: ulidSchema,
  fieldId: ulidSchema,
});

export function createFieldRoutes({ fieldService }: FieldRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // List Fields
  const listFieldsRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["Fields"],
    request: {
      params: collectionParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listFieldsResponseSchema,
          },
        },
        description: "List of fields",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Collection not found",
      },
    },
  });

  app.openapi(listFieldsRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId } = c.req.valid("param");
    const result = await fieldService.listFields(workspaceId, collectionId);

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get Field
  const getFieldRoute = createRoute({
    method: "get",
    path: "/{fieldId}",
    tags: ["Fields"],
    request: {
      params: fieldParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getFieldResponseSchema,
          },
        },
        description: "Field details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Field not found",
      },
    },
  });

  app.openapi(getFieldRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId, fieldId } = c.req.valid("param");
    const result = await fieldService.getField(
      workspaceId,
      collectionId,
      fieldId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Create Field
  const createFieldRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["Fields"],
    request: {
      params: collectionParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: createFieldRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createFieldResponseSchema,
          },
        },
        description: "Field created",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Collection not found",
      },
      409: {
        description: "Field slug already exists",
      },
    },
  });

  app.openapi(createFieldRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await fieldService.createField(
      workspaceId,
      collectionId,
      body,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 201);
  });

  // Update Field
  const updateFieldRoute = createRoute({
    method: "patch",
    path: "/{fieldId}",
    tags: ["Fields"],
    request: {
      params: fieldParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: updateFieldRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updateFieldResponseSchema,
          },
        },
        description: "Field updated",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Field not found",
      },
    },
  });

  app.openapi(updateFieldRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId, fieldId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await fieldService.updateField(
      workspaceId,
      collectionId,
      fieldId,
      body,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Delete Field
  const deleteFieldRoute = createRoute({
    method: "delete",
    path: "/{fieldId}",
    tags: ["Fields"],
    request: {
      params: fieldParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: deleteFieldResponseSchema,
          },
        },
        description: "Field deleted",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Field not found",
      },
    },
  });

  app.openapi(deleteFieldRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId, fieldId } = c.req.valid("param");
    const result = await fieldService.deleteField(
      workspaceId,
      collectionId,
      fieldId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
