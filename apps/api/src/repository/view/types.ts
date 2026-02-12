import type { View, NewView, ViewConfig } from "@folio/db/schema";

export type CreateViewInput = Omit<NewView, "id" | "createdAt" | "updatedAt">;

export type UpdateViewInput = Partial<
  Pick<View, "name" | "description" | "config" | "isActive">
>;

export type { ViewConfig };
