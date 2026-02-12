import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";

import type { AppConfig } from "./config";
import APP_CONFIG from "./config";
import type { AppEnv } from "@/types/hono";
import { createLogger, type Logger } from "@/utils/logger";
import {
  createTransactionWrapper,
  type TransactionWrapper,
} from "@/client/postgres/transaction";

import { createRepositories, type Repositories } from "@/repository";
import { createUsecases, type Usecases } from "@/usecase";
import { createServices, type Services } from "@/service";
import {
  createAuthRoutes,
  createWorkspaceRoutes,
  createCollectionRoutes,
  createFieldRoutes,
  createRecordRoutes,
  createApiRoutes,
  createCompositionRoutes,
  createCompositionExecuteRoutes,
  createApiKeyRoutes,
  createAccessRuleRoutes,
} from "@/routes";
import {
  createAuthMiddleware,
  extractToken,
  parseSessionId,
} from "@/middleware";
import { getCookie } from "hono/cookie";

export class Container {
  private static instance: Container;
  private appConfig: AppConfig;

  private pool: Pool;
  private dbClient: NodePgDatabase;
  private txWrapper: TransactionWrapper;
  private logger: Logger;

  private repositories: Repositories;
  private usecases: Usecases;
  private services: Services;

  public hono: OpenAPIHono<AppEnv>;

  private constructor() {
    this.hono = new OpenAPIHono<AppEnv>();
    this.appConfig = APP_CONFIG;
    this.logger = createLogger(this.appConfig.logger);

    // Database connection
    this.pool = new Pool({
      connectionString: this.appConfig.postgres.connectionString,
    });
    this.dbClient = drizzle(this.pool);
    this.txWrapper = createTransactionWrapper(this.dbClient);

    // Initialize layers
    this.repositories = createRepositories({
      db: this.dbClient,
      pool: this.pool,
      logger: this.logger,
    });
    this.usecases = createUsecases({
      repositories: this.repositories,
      txWrapper: this.txWrapper,
      logger: this.logger,
    });
    this.services = createServices({
      usecases: this.usecases,
    });

    // Setup middleware and routes
    this.initMiddleware();
    this.initRoutes();
    this.initOpenAPI();
    this.initErrorHandlers();
  }

  private initMiddleware(): void {
    this.hono.use("*", honoLogger());
    this.hono.use(
      "*",
      cors({
        origin: [
          "http://localhost:3000",
          "http://localhost:5173",
          "https://local.folio.com:3000",
        ],
        credentials: true,
      }),
    );

    // Token extraction middleware - runs on all routes
    // Extracts sessionId from token if present, doesn't reject unauthenticated requests
    this.hono.use("*", async (c, next) => {
      const token = extractToken(
        getCookie(c, "access_token"),
        c.req.header("Authorization"),
      );

      if (token) {
        const sessionId = parseSessionId(token);
        if (sessionId) {
          c.set("sessionId", sessionId);
        }
      }

      await next();
    });
  }

  private initRoutes(): void {
    // Health check (public)
    this.hono.get("/health", (c) => {
      return c.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Auth routes (public)
    const authRoutes = createAuthRoutes({ authService: this.services.auth });
    this.hono.route("/api/v1/auth", authRoutes);

    // Composition execution routes (public - BEFORE auth middleware)
    // Public compositions can be accessed without authentication
    const compositionExecuteRoutes = createCompositionExecuteRoutes({
      compositionService: this.services.composition,
    });
    this.hono.route("/api/v1/c", compositionExecuteRoutes);

    // Protected routes
    const authMiddleware = createAuthMiddleware({
      sessionRepository: this.repositories.session,
    });
    this.hono.use("/api/v1/workspaces/*", authMiddleware);
    const workspaceRoutes = createWorkspaceRoutes({
      workspaceService: this.services.workspace,
    });
    this.hono.route("/api/v1/workspaces", workspaceRoutes);

    // Collection routes (nested under workspaces)
    const collectionRoutes = createCollectionRoutes({
      collectionService: this.services.collection,
    });
    this.hono.route(
      "/api/v1/workspaces/:workspaceId/collections",
      collectionRoutes,
    );

    // Field routes (nested under collections)
    const fieldRoutes = createFieldRoutes({
      fieldService: this.services.field,
    });
    this.hono.route(
      "/api/v1/workspaces/:workspaceId/collections/:collectionId/fields",
      fieldRoutes,
    );

    // Record routes (nested under collections)
    const recordRoutes = createRecordRoutes({
      recordService: this.services.record,
    });
    this.hono.route(
      "/api/v1/workspaces/:workspaceId/collections/:collectionId/records",
      recordRoutes,
    );

    // API routes (nested under workspaces)
    const apiRoutes = createApiRoutes({
      apiService: this.services.api,
    });
    this.hono.route("/api/v1/workspaces/:workspaceId/apis", apiRoutes);

    // Composition routes (nested under workspaces)
    const compositionRoutes = createCompositionRoutes({
      compositionService: this.services.composition,
    });
    this.hono.route(
      "/api/v1/workspaces/:workspaceId/compositions",
      compositionRoutes,
    );

    // API Key routes (nested under workspaces)
    const apiKeyRoutes = createApiKeyRoutes({
      apiKeyService: this.services.apiKey,
    });
    this.hono.route("/api/v1/workspaces/:workspaceId/api-keys", apiKeyRoutes);

    // Access Rule routes (nested under workspaces)
    const accessRuleRoutes = createAccessRuleRoutes({
      accessRuleService: this.services.accessRule,
    });
    this.hono.route(
      "/api/v1/workspaces/:workspaceId/access-rules",
      accessRuleRoutes,
    );
  }

  private initOpenAPI(): void {
    this.hono.doc("/api/v1/openapi", {
      openapi: "3.0.0",
      info: {
        title: "Folio API",
        version: "1.0.0",
        description: "User-programmable backend for data models and APIs",
      },
      servers: [
        {
          url:
            this.appConfig.nodeEnv === "production"
              ? "https://api.folio.app"
              : `http://localhost:${this.appConfig.server.port}`,
          description:
            this.appConfig.nodeEnv === "production"
              ? "Production server"
              : "Development server",
        },
      ],
    });

    this.hono.get("/api/v1/docs", swaggerUI({ url: "/api/v1/openapi" }));
  }

  private initErrorHandlers(): void {
    this.hono.onError((err, c) => {
      this.logger.error("Unhandled error", { error: err });
      return c.json(
        {
          error: "Internal Server Error",
          message:
            this.appConfig.nodeEnv === "development" ? err.message : undefined,
        },
        500,
      );
    });

    this.hono.notFound((c) => {
      return c.json({ error: "Not Found" }, 404);
    });
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public getServices(): Services {
    return this.services;
  }

  public getUsecases(): Usecases {
    return this.usecases;
  }

  public getRepositories(): Repositories {
    return this.repositories;
  }

  public getLogger(): Logger {
    return this.logger;
  }

  public getConfig(): AppConfig {
    return this.appConfig;
  }

  public async shutdown(): Promise<void> {
    this.logger.info("Shutting down...");
    await this.pool.end();
  }
}
