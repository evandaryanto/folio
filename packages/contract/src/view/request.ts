import { z } from "zod";
import { ViewType, ChartType } from "../enums";

// Table view config
export const tableViewConfigSchema = z.object({
  columns: z.array(
    z.object({
      field: z.string().min(1),
      label: z.string().optional(),
      width: z.number().positive().optional(),
      sortable: z.boolean().optional(),
    }),
  ),
  pageSize: z.number().int().positive().max(100).optional().default(20),
});
export type TableViewConfig = z.infer<typeof tableViewConfigSchema>;

// Chart view config
export const chartViewConfigSchema = z.object({
  chartType: z.nativeEnum(ChartType),
  xAxis: z.string().min(1),
  yAxis: z.array(z.string().min(1)).min(1),
  colors: z.array(z.string()).optional(),
  showLegend: z.boolean().optional().default(true),
  showGrid: z.boolean().optional().default(true),
});
export type ChartViewConfig = z.infer<typeof chartViewConfigSchema>;

// Union config schema
export const viewConfigSchema = z.union([
  tableViewConfigSchema,
  chartViewConfigSchema,
]);
export type ViewConfig = z.infer<typeof viewConfigSchema>;

// Create View
export const createViewRequestSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9_-]+$/,
      "Slug can only contain lowercase letters, numbers, underscores, and hyphens",
    ),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  compositionId: z.string().length(26),
  viewType: z.nativeEnum(ViewType),
  config: viewConfigSchema,
  isActive: z.boolean().optional().default(true),
});
export type CreateViewRequest = z.infer<typeof createViewRequestSchema>;

// Update View
export const updateViewRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  config: viewConfigSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateViewRequest = z.infer<typeof updateViewRequestSchema>;
