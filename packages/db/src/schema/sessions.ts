import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import { ulidColumn, ulidPrimaryKey } from "../utils/ulid";

export const sessions = pgTable(
  "sessions",
  {
    id: ulidPrimaryKey(),
    userId: ulidColumn("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    refreshTokenHash: varchar("refresh_token_hash", { length: 255 }).notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),

    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
