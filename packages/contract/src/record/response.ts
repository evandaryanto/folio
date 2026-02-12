import { z } from "zod";
import { ulidSchema, paginationInfoSchema } from "../common";

// Record Schema
export const recordSchema = z.object({
  id: ulidSchema,
  workspaceId: ulidSchema,
  collectionId: ulidSchema,
  data: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: ulidSchema.nullable(),
  updatedBy: ulidSchema.nullable(),
});
export type RecordResponse = z.infer<typeof recordSchema>;

// Get Record Response
export const getRecordResponseSchema = z.object({
  record: recordSchema,
});
export type GetRecordResponse = z.infer<typeof getRecordResponseSchema>;

// List Records Response
export const listRecordsResponseSchema = z.object({
  records: z.array(recordSchema),
  pagination: paginationInfoSchema,
});
export type ListRecordsResponse = z.infer<typeof listRecordsResponseSchema>;

// Create Record Response
export const createRecordResponseSchema = z.object({
  record: recordSchema,
});
export type CreateRecordResponse = z.infer<typeof createRecordResponseSchema>;

// Update Record Response
export const updateRecordResponseSchema = z.object({
  record: recordSchema,
});
export type UpdateRecordResponse = z.infer<typeof updateRecordResponseSchema>;

// Delete Record Response
export const deleteRecordResponseSchema = z.object({
  success: z.boolean(),
});
export type DeleteRecordResponse = z.infer<typeof deleteRecordResponseSchema>;

// Bulk Create Records Response
export const bulkCreateRecordsResponseSchema = z.object({
  records: z.array(recordSchema),
  totalCreated: z.number(),
});
export type BulkCreateRecordsResponse = z.infer<
  typeof bulkCreateRecordsResponseSchema
>;
