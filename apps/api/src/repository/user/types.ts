import type { User, NewUser } from "@folio/db/schema";

export type CreateUserInput = NewUser;

export type UpdateUserInput = Partial<
  Pick<User, "name" | "isActive" | "lastLoginAt" | "passwordHash">
>;
