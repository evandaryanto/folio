import { z } from "zod";
import { ulidSchema, paginationInfoSchema } from "../common";
import { workspaceSettingsSchema } from "./request";

// Workspace Schema
export const workspaceSchema = z.object({
  id: ulidSchema,
  name: z.string(),
  slug: z.string(),
  settings: workspaceSettingsSchema.nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type WorkspaceResponse = z.infer<typeof workspaceSchema>;

// Get Workspace Response
export const getWorkspaceResponseSchema = z.object({
  workspace: workspaceSchema,
});
export type GetWorkspaceResponse = z.infer<typeof getWorkspaceResponseSchema>;

// List Workspaces Response
export const listWorkspacesResponseSchema = z.object({
  workspaces: z.array(workspaceSchema),
  pagination: paginationInfoSchema,
});
export type ListWorkspacesResponse = z.infer<
  typeof listWorkspacesResponseSchema
>;

// Update Workspace Response
export const updateWorkspaceResponseSchema = z.object({
  workspace: workspaceSchema,
});
export type UpdateWorkspaceResponse = z.infer<
  typeof updateWorkspaceResponseSchema
>;

// Delete Workspace Response
export const deleteWorkspaceResponseSchema = z.object({
  success: z.boolean(),
});
export type DeleteWorkspaceResponse = z.infer<
  typeof deleteWorkspaceResponseSchema
>;
