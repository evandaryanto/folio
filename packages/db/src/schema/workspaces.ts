import {
  boolean,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { ulidPrimaryKey } from "../utils/ulid";

export interface WorkspaceSettings {
  timezone?: string;
  locale?: string;
  [key: string]: unknown;
}

export const workspaces = pgTable(
  "workspaces",
  {
    id: ulidPrimaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    settings: jsonb("settings").default({}).$type<WorkspaceSettings>(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("workspaces_slug_idx").on(table.slug)],
);

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
