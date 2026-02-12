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
import { compositions } from "./compositions";
import { viewTypeEnum } from "./enums";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";

export interface TableViewConfig {
  columns: Array<{
    field: string;
    label?: string;
    width?: number;
    sortable?: boolean;
  }>;
  pageSize?: number;
}

export interface ChartViewConfig {
  chartType: "bar" | "line" | "pie" | "area";
  xAxis: string;
  yAxis: string[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}

export type ViewConfig = TableViewConfig | ChartViewConfig;

export const views = pgTable(
  "views",
  {
    id: ulidPrimaryKey(),
    workspaceId: ulidColumn("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    compositionId: ulidColumn("composition_id")
      .notNull()
      .references(() => compositions.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    viewType: viewTypeEnum("view_type").notNull(),
    config: jsonb("config").notNull().$type<ViewConfig>(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdBy: ulidColumn("created_by").references(() => users.id),
  },
  (table) => [
    uniqueIndex("views_workspace_slug_idx").on(table.workspaceId, table.slug),
    index("views_workspace_id_idx").on(table.workspaceId),
    index("views_composition_id_idx").on(table.compositionId),
  ],
);

export type View = typeof views.$inferSelect;
export type NewView = typeof views.$inferInsert;
