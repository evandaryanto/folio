import type { NewUserRole } from "@folio/db/schema";

export type CreateUserRoleInput = Omit<NewUserRole, "id" | "createdAt">;
