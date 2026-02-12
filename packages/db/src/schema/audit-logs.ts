import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: ulidPrimaryKey(),
    workspaceId: ulidColumn("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: ulidColumn("user_id").references(() => users.id),

    // What happened
    action: varchar("action", { length: 50 }).notNull(),
    resourceType: varchar("resource_type", { length: 50 }).notNull(),
    resourceId: ulidColumn("resource_id"),

    // Change details
    changes: jsonb("changes").$type<{
      before?: unknown;
      after?: unknown;
    }>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    // Context
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_workspace_id_idx").on(table.workspaceId),
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
