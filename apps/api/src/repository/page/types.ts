import type { Page, NewPage, PageBlock } from "@folio/db/schema";

export type CreatePageInput = Omit<NewPage, "id" | "createdAt" | "updatedAt">;

export type UpdatePageInput = Partial<
  Pick<Page, "name" | "description" | "blocks" | "isActive">
>;

export type { PageBlock };
