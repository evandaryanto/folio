import type { Role, NewRole } from "@folio/db/schema";

export type CreateRoleInput = Omit<NewRole, "id" | "createdAt" | "updatedAt">;

export type UpdateRoleInput = Partial<Pick<Role, "name" | "description">>;
