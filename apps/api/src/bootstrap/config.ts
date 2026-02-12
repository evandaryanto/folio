import { config } from "dotenv";
import { resolve } from "path";

// Load .env from monorepo root
config({ path: resolve(__dirname, "../../../../.env") });

const PG_CONFIG = {
  connectionString:
    process.env.DATABASE_URL || "postgres://localhost:5432/folio",
} as const;

const LOGGER_CONFIG = {
  level: process.env.LOG_LEVEL || "info",
  service: process.env.SERVICE_NAME || "folio-api",
} as const;

const SERVER_CONFIG = {
  port: process.env.PORT ? Number(process.env.PORT) : 3001,
  host: process.env.HOST || "localhost",
} as const;

const APP_CONFIG = {
  postgres: PG_CONFIG,
  logger: LOGGER_CONFIG,
  server: SERVER_CONFIG,
  nodeEnv: process.env.NODE_ENV || "development",
} as const;

export default APP_CONFIG;

export type AppConfig = typeof APP_CONFIG;
