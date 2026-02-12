import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";

export const collections = pgTable(
  "collections",
  {
    id: ulidPrimaryKey(),
    workspaceId: ulidColumn("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }),
    isActive: boolean("is_active").default(true).notNull(),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdBy: ulidColumn("created_by").references(() => users.id),
  },
  (table) => [
    uniqueIndex("collections_workspace_slug_idx").on(
      table.workspaceId,
      table.slug,
    ),
    index("collections_workspace_id_idx").on(table.workspaceId),
  ],
);

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
