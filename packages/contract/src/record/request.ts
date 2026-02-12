import { z } from "zod";

// Create Record
export const createRecordRequestSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});
export type CreateRecordRequest = z.infer<typeof createRecordRequestSchema>;

// Update Record
export const updateRecordRequestSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});
export type UpdateRecordRequest = z.infer<typeof updateRecordRequestSchema>;
