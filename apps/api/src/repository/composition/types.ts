import type {
  Composition,
  NewComposition,
  CompositionConfig,
} from "@folio/db/schema";

export type CreateCompositionInput = Omit<
  NewComposition,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateCompositionInput = Partial<
  Pick<
    Composition,
    "name" | "description" | "config" | "accessLevel" | "isActive"
  >
>;

export type { CompositionConfig };
