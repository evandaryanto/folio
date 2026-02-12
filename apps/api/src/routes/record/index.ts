import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { RecordService } from "@/service/record";
import type { AppEnv } from "@/types/hono";
import { handleServiceError } from "@/utils/helpers/service-result";
import {
  ulidSchema,
  cursorPaginationQuerySchema,
} from "@folio/contract/common";
import {
  createRecordRequestSchema,
  updateRecordRequestSchema,
  getRecordResponseSchema,
  listRecordsResponseSchema,
  createRecordResponseSchema,
  updateRecordResponseSchema,
  deleteRecordResponseSchema,
} from "@folio/contract/record";

interface RecordRoutesDeps {
  recordService: RecordService;
}

const collectionParamsSchema = z.object({
  workspaceId: ulidSchema,
  collectionId: ulidSchema,
});

const recordParamsSchema = z.object({
  workspaceId: ulidSchema,
  collectionId: ulidSchema,
  recordId: ulidSchema,
});

export function createRecordRoutes({ recordService }: RecordRoutesDeps) {
  const app = new OpenAPIHono<AppEnv>();

  // List Records
  const listRecordsRoute = createRoute({
    method: "get",
    path: "/",
    tags: ["Records"],
    request: {
      params: collectionParamsSchema,
      query: cursorPaginationQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: listRecordsResponseSchema,
          },
        },
        description: "List of records",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Collection not found",
      },
    },
  });

  app.openapi(listRecordsRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId } = c.req.valid("param");
    const query = c.req.valid("query");
    const result = await recordService.listRecords(workspaceId, collectionId, {
      cursor: query.cursor,
      limit: query.limit,
    });

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Get Record
  const getRecordRoute = createRoute({
    method: "get",
    path: "/{recordId}",
    tags: ["Records"],
    request: {
      params: recordParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getRecordResponseSchema,
          },
        },
        description: "Record details",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Record not found",
      },
    },
  });

  app.openapi(getRecordRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId, recordId } = c.req.valid("param");
    const result = await recordService.getRecord(
      workspaceId,
      collectionId,
      recordId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Create Record
  const createRecordRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["Records"],
    request: {
      params: collectionParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: createRecordRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createRecordResponseSchema,
          },
        },
        description: "Record created",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Collection not found",
      },
    },
  });

  app.openapi(createRecordRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await recordService.createRecord(
      workspaceId,
      collectionId,
      body,
      userId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 201);
  });

  // Update Record
  const updateRecordRoute = createRoute({
    method: "patch",
    path: "/{recordId}",
    tags: ["Records"],
    request: {
      params: recordParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: updateRecordRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updateRecordResponseSchema,
          },
        },
        description: "Record updated",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Record not found",
      },
    },
  });

  app.openapi(updateRecordRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId, recordId } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await recordService.updateRecord(
      workspaceId,
      collectionId,
      recordId,
      body,
      userId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  // Delete Record
  const deleteRecordRoute = createRoute({
    method: "delete",
    path: "/{recordId}",
    tags: ["Records"],
    request: {
      params: recordParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: deleteRecordResponseSchema,
          },
        },
        description: "Record deleted",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Record not found",
      },
    },
  });

  app.openapi(deleteRecordRoute, async (c) => {
    const userId = c.get("userId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401) as never;
    }

    const { workspaceId, collectionId, recordId } = c.req.valid("param");
    const result = await recordService.deleteRecord(
      workspaceId,
      collectionId,
      recordId,
    );

    if (!result.ok) {
      return handleServiceError(c, result) as never;
    }

    return c.json(result.data, 200);
  });

  return app;
}
