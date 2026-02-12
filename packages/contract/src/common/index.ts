import { z } from "zod";

// =============================================================================
// ULID
// =============================================================================

/**
 * ULID validation regex pattern (26 characters, Crockford's base32)
 */
export const ULID_REGEX = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;

/**
 * Zod schema for ULID validation
 */
export const ulidSchema = z
  .string()
  .length(26)
  .regex(ULID_REGEX, "Invalid ULID");
export type Ulid = z.infer<typeof ulidSchema>;

// =============================================================================
// CURSOR PAGINATION
// =============================================================================

/**
 * Query parameters for cursor-based pagination
 */
export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().length(26).regex(ULID_REGEX).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

/**
 * Pagination info returned in responses
 */
export const paginationInfoSchema = z.object({
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
});
export type PaginationInfo = z.infer<typeof paginationInfoSchema>;

// =============================================================================
// LEGACY OFFSET PAGINATION (deprecated, use cursor pagination)
// =============================================================================

// Pagination
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type Pagination = z.infer<typeof paginationSchema>;

// Pagination Query
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// =============================================================================
// ID PARAM
// =============================================================================

// ID Param (ULID)
export const idParamSchema = z.object({
  id: ulidSchema,
});
export type IdParam = z.infer<typeof idParamSchema>;

// Success Response
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
export type SuccessResponse = z.infer<typeof successResponseSchema>;

// Error Response
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Date Range Query
export const dateRangeQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;

// Sort Query
export const sortQuerySchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type SortQuery = z.infer<typeof sortQuerySchema>;
