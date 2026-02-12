import { index, pgTable, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { roles } from "./roles";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";

export const userRoles = pgTable(
  "user_roles",
  {
    id: ulidPrimaryKey(),
    userId: ulidColumn("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: ulidColumn("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_roles_user_role_idx").on(table.userId, table.roleId),
    index("user_roles_role_id_idx").on(table.roleId),
  ],
);

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
