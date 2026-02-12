import type {
  AccessRule,
  NewAccessRule,
  AccessConditions,
} from "@folio/db/schema";

export type CreateAccessRuleInput = Omit<
  NewAccessRule,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateAccessRuleInput = Partial<
  Pick<AccessRule, "actions" | "conditions">
>;

export type { AccessConditions };
