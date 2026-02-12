import type { Field, NewField, FieldOptions } from "@folio/db/schema";

export type CreateFieldInput = Omit<NewField, "id" | "createdAt" | "updatedAt">;

export type UpdateFieldInput = Partial<
  Pick<
    Field,
    | "name"
    | "isRequired"
    | "isUnique"
    | "defaultValue"
    | "options"
    | "sortOrder"
  >
>;

export type { FieldOptions };
