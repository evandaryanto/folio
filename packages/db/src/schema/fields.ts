import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { collections } from "./collections";
import { fieldTypeEnum } from "./enums";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";

export interface FieldOptions {
  // select / multi_select
  choices?: Array<{ value: string; label: string }>;
  // number
  min?: number;
  max?: number;
  precision?: number;
  // text
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  // relation
  relatedCollectionId?: string;
  relatedFieldSlug?: string;
  // any
  [key: string]: unknown;
}

export const fields = pgTable(
  "fields",
  {
    id: ulidPrimaryKey(),
    collectionId: ulidColumn("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fieldType: fieldTypeEnum("field_type").notNull(),
    isRequired: boolean("is_required").default(false).notNull(),
    isUnique: boolean("is_unique").default(false).notNull(),
    defaultValue: jsonb("default_value"),
    options: jsonb("options").default({}).$type<FieldOptions>(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("fields_collection_slug_idx").on(
      table.collectionId,
      table.slug,
    ),
    index("fields_collection_id_idx").on(table.collectionId),
  ],
);

export type Field = typeof fields.$inferSelect;
export type NewField = typeof fields.$inferInsert;
