import type { Config } from "drizzle-kit";
import "dotenv/config";

const connectionString =
  process.env.DATABASE_URL || "postgres://folio:folio@localhost:5432/folio";

export default {
  schema: "./src/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
    ssl: connectionString.includes("rds.amazonaws.com")
      ? { rejectUnauthorized: false }
      : false,
  },
} satisfies Config;
