import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";

export interface ViewBlock {
  type: "view";
  viewId: string;
  title?: string;
}

export interface TextBlock {
  type: "text";
  content: string;
  format?: "plain" | "markdown";
}

export type PageBlock = ViewBlock | TextBlock;

export const pages = pgTable(
  "pages",
  {
    id: ulidPrimaryKey(),
    workspaceId: ulidColumn("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    blocks: jsonb("blocks").notNull().$type<PageBlock[]>(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdBy: ulidColumn("created_by").references(() => users.id),
  },
  (table) => [
    uniqueIndex("pages_workspace_slug_idx").on(table.workspaceId, table.slug),
    index("pages_workspace_id_idx").on(table.workspaceId),
  ],
);

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
