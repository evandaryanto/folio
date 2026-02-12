import { z } from "zod";

// Workspace Settings
export const workspaceSettingsSchema = z
  .object({
    timezone: z.string().optional(),
    locale: z.string().optional(),
  })
  .passthrough();
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;

// Update Workspace
export const updateWorkspaceRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  settings: workspaceSettingsSchema.optional(),
});
export type UpdateWorkspaceRequest = z.infer<
  typeof updateWorkspaceRequestSchema
>;
