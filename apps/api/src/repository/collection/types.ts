import type { Collection, NewCollection } from "@folio/db/schema";

export type CreateCollectionInput = Omit<
  NewCollection,
  "id" | "createdAt" | "updatedAt" | "version"
>;

export type UpdateCollectionInput = Partial<
  Pick<Collection, "name" | "description" | "icon" | "isActive">
>;
