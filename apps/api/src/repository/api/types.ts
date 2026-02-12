import type { Api, NewApi, ApiConfig } from "@folio/db/schema";

export type CreateApiInput = Omit<NewApi, "id" | "createdAt" | "updatedAt">;

export type UpdateApiInput = Partial<
  Pick<Api, "name" | "description" | "config" | "accessLevel" | "isActive">
>;

export type { ApiConfig };
