import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { roles } from "./roles";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";

export interface AccessConditions {
  // Row-level conditions
  where?: Record<string, unknown>;
  // Field-level restrictions
  allowedFields?: string[];
  deniedFields?: string[];
}

export const accessRules = pgTable(
  "access_rules",
  {
    id: ulidPrimaryKey(),
    workspaceId: ulidColumn("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    roleId: ulidColumn("role_id").references(() => roles.id, {
      onDelete: "cascade",
    }),
    resourceType: varchar("resource_type", { length: 50 }).notNull(), // 'collection', 'api', 'composition'
    resourceId: ulidColumn("resource_id"), // null = all of type
    actions: jsonb("actions").default([]).$type<string[]>(), // ["read", "create", "update", "delete"]
    conditions: jsonb("conditions").$type<AccessConditions>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("access_rules_workspace_id_idx").on(table.workspaceId),
    index("access_rules_role_id_idx").on(table.roleId),
    index("access_rules_resource_idx").on(table.resourceType, table.resourceId),
  ],
);

export type AccessRule = typeof accessRules.$inferSelect;
export type NewAccessRule = typeof accessRules.$inferInsert;
