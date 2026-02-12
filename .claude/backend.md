# Project Documentation

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Hono with @hono/zod-openapi |
| Runtime | Bun (dev), Node.js (prod) |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Cache | Redis |
| Validation | Zod |
| Testing | Jest |
| IDs | ULID (Universally Unique Lexicographically Sortable Identifier) |
| Pagination | Cursor-based (no offset) |

---

## Directory Structure

```
src/
├── bootstrap/
│   ├── config.ts                 # App configuration
│   ├── container.ts              # DI container (singleton)
│   └── index.ts                  # Bootstrap entry point
│
├── client/
│   ├── postgres/
│   │   ├── index.ts              # Exports
│   │   ├── config.ts             # PG config
│   │   ├── connection.ts         # Connection factory
│   │   └── transaction.ts        # Transaction wrapper
│   └── redis/
│       ├── index.ts              # Redis client class
│       └── config.ts             # Redis config
│
├── entity/                       # Database schemas (Drizzle)
│   └── {domain}/
│       └── schema.ts
│
├── repository/
│   ├── index.ts                  # Factory: creates all repositories
│   └── {domain}/
│       ├── index.ts              # Repository class
│       └── types.ts
│
├── usecase/
│   ├── index.ts                  # Factory: creates all usecases
│   ├── {domain}.ts               # Usecase class
│   └── __tests__/
│       └── {domain}.test.ts
│
├── services/
│   ├── index.ts                  # Factory: creates all services
│   ├── {domain}.service.ts       # Service class
│   └── __tests__/
│       └── {domain}.service.test.ts
│
├── routes/
│   └── {domain}.router.ts        # Router class
│
├── utils/
│   ├── types/
│   │   ├── result.ts             # Result types
│   │   └── error-code.ts         # Error codes
│   ├── helpers/
│   │   ├── context.ts            # Identity helpers
│   │   └── service-result.ts     # Service result helpers
│   ├── logger/
│   │   └── index.ts              # Logger factory
│   └── openapi/
│       └── routes.ts             # Route definitions
│
└── dev.ts                        # Local dev entry

scripts/                          # Manual test scripts
drizzle/                          # Generated migrations
```

---

## Key Design Patterns

### ULID (Primary Keys)

All entities use ULID instead of UUID for primary keys.

```typescript
// packages/db/src/utils/ulid.ts
import { ulid } from 'ulid';
import { varchar } from 'drizzle-orm/pg-core';

export const ulidPrimaryKey = (name: string = 'id') =>
  varchar(name, { length: 26 }).primaryKey().$defaultFn(() => ulid());

// Usage in schema
export const companies = pgTable('companies', {
  id: ulidPrimaryKey(),
  // ...
});
```

**Why ULID over UUID?**
- Lexicographically sortable (time-based prefix)
- Perfect for cursor pagination
- More efficient B-tree indexes
- 26 chars vs 36 chars (UUID)

### Cursor Pagination

All list endpoints use cursor pagination (no offset/limit).

**Contract schemas:**
```typescript
// packages/contract/src/common/pagination.ts
export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().length(26).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const paginationInfoSchema = z.object({
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
});
```

**Repository helper:**
```typescript
// packages/db/src/utils/pagination.ts
export function buildPaginationResult<T extends { id: string }>(
  items: T[],
  limit: number
): PaginationResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;

  return {
    data,
    pagination: {
      hasMore,
      nextCursor: data.length > 0 ? data[data.length - 1].id : null,
    },
  };
}
```

**Repository usage:**
```typescript
async findByCompany(
  companyId: string,
  params: CursorPaginationParams
): Promise<ResponseResult<PaginatedResponse<Account>>> {
  const { cursor, limit } = params;

  const query = this.db
    .select()
    .from(accounts)
    .where(and(
      eq(accounts.companyId, companyId),
      cursor ? lt(accounts.id, cursor) : undefined
    ))
    .orderBy(desc(accounts.id))
    .limit(limit + 1);

  const items = await query;
  return ok(buildPaginationResult(items, limit));
}
```

**API response format:**
```json
{
  "accounts": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "01HXYZ..."
  }
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Routes                                                 │
│  - HTTP entry point                                     │
│  - Request validation                                   │
│  - Response formatting                                  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Services                                               │
│  - Extract identity from context                        │
│  - Map business errors to HTTP status                   │
│  - Exception handling                                   │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Usecases                                               │
│  - Business logic                                       │
│  - Authorization checks                                 │
│  - Transaction orchestration                            │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Repositories                                           │
│  - Database queries                                     │
│  - Data transformation                                  │
│  - Error wrapping                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Utils: Result Types

```typescript
// src/utils/types/result.ts
import type { StatusCode } from 'hono/utils/http-status';

export type ResponseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export type ServiceResult<T> =
  | { ok: true; data: T; status?: StatusCode }
  | {
      ok: false;
      error: { code: string; message: string; details?: Record<string, any> };
      status: StatusCode;
    };

export type Result<T, E = AppError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export enum ErrorCode {
  ValidationError = 'VALIDATION_ERROR',
  RequiredField = 'REQUIRED_FIELD',
  InvalidFormat = 'INVALID_FORMAT',
  NotFound = 'NOT_FOUND',
  AlreadyExists = 'ALREADY_EXISTS',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  Expired = 'EXPIRED',
  InternalError = 'INTERNAL_ERROR',
  ExternalServiceError = 'EXTERNAL_SERVICE_ERROR',
  OperationFailed = 'OPERATION_FAILED',
  InvalidOperation = 'INVALID_OPERATION',
}

export const ok = <T>(data: T): Result<T, never> => ({
  ok: true,
  data,
});

export const err = <E = AppError>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

export const createError = (
  code: string,
  message: string,
  details?: Record<string, any>
): AppError => ({
  code,
  message,
  details,
});
```

---

## Utils: Error Codes

```typescript
// src/utils/types/error-code.ts
export enum LlmErrorCode {
  RateLimitExceeded = '429',
  QuotaExhausted = '402',
  AuthenticationError = '401',
  ServiceUnavailable = '503',
  DeadlineExceeded = '504',
  NoContextFound = 'NO_CONTEXT',
  HallucinationRisk = 'RISK_LOW_CONFIDENCE',
  ContextTokenLimit = 'CONTEXT_TOO_LARGE',
  SensitiveDataBlocked = 'SAFETY_FILTER',
  InvalidResponseFormat = 'FORMAT_ERROR',
  InternalError = 'INTERNAL_ERROR',
  ChunkSizeExceeded = 'CHUNK_SIZE_EXCEEDED',
  TokenCountError = 'TOKEN_COUNT_ERROR',
  EmbeddingGenerationFailed = 'EMBEDDING_GENERATION_FAILED',
}

export enum RedisErrorCode {
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  EXECUTION_FAILURE = 'EXECUTION_FAILURE',
  TIMEOUT = 'TIMEOUT',
}
```

---

## Utils: Context Helpers

```typescript
// src/utils/helpers/context.ts
import type { Context } from 'hono';
import type { SessionData } from '@/client/authorizer/types';

const IDENTITY_KEY = 'identity';

export function setIdentity(c: Context, identity: SessionData): void {
  c.set(IDENTITY_KEY, identity);
}

export function getIdentity(c: Context): SessionData | undefined {
  return c.get(IDENTITY_KEY);
}
```

---

## Utils: Service Result Helpers

```typescript
// src/utils/helpers/service-result.ts
import type { StatusCode } from 'hono/utils/http-status';
import type { Context } from 'hono';
import type { AppError, ServiceResult } from '@/utils/types/result';
import { ErrorCode } from '@/utils/types/result';

export const toServiceError = <T>(
  error: AppError,
  defaultStatus: StatusCode = 400
): ServiceResult<T> => ({
  ok: false,
  error: {
    code: error.code,
    message: error.message,
    details: error.details,
  },
  status: defaultStatus,
});

export const toServiceSuccess = <T>(data: T): ServiceResult<T> => ({
  ok: true,
  data,
});

export const toServiceException = <T>(
  e: unknown,
  defaultMessage = 'An unexpected error occurred',
  defaultStatus: StatusCode = 500
): ServiceResult<T> => {
  if (e instanceof Error) {
    return {
      ok: false,
      error: {
        code: ErrorCode.InternalError,
        message: e.message || defaultMessage,
        details: e.stack,
      },
      status: defaultStatus,
    };
  }

  return {
    ok: false,
    error: {
      code: ErrorCode.InternalError,
      message: defaultMessage,
    },
    status: defaultStatus,
  };
};

export const handleServiceError = <T>(
  c: Context,
  result: Extract<ServiceResult<T>, { ok: false }>
) => {
  const status = result.status ?? 500;

  return c.json(
    {
      code: result.error.code as ErrorCode,
      message: result.error.message,
      details: result.error.details,
    },
    status as any
  );
};
```

---

## Utils: Logger

```typescript
// src/utils/logger/index.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LoggerOptions {
  level?: string;
  service?: string;
}

interface LogData {
  [key: string]: unknown;
}

export interface Logger {
  info: (message: string, meta?: LogData) => void;
  warn: (message: string, meta?: LogData) => void;
  error: (message: string, meta?: LogData) => void;
  debug: (message: string, meta?: LogData) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export const createLogger = (options?: LoggerOptions): Logger => {
  const logLevel = options?.level || process.env.LOG_LEVEL || 'info';
  const serviceName = options?.service || process.env.SERVICE_NAME || 'app';
  const minLevel = LOG_LEVELS[logLevel as LogLevel] ?? LOG_LEVELS.info;

  const log = (level: LogLevel, message: string, meta?: LogData) => {
    if (LOG_LEVELS[level] < minLevel) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: serviceName,
      ...meta,
    };

    console.log(JSON.stringify(logEntry));
  };

  return {
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
    debug: (message, meta) => log('debug', message, meta),
  };
};

export const logger = createLogger();
export default logger;
```

---

## Client: PostgreSQL

### Config

```typescript
// src/client/postgres/config.ts
export const PG_CONFIG = {
  user: process.env.PG_USER ?? 'postgres',
  password: process.env.PG_PASSWORD ?? 'password',
  host: process.env.PG_HOST ?? 'localhost',
  port: Number(process.env.PG_PORT ?? 5433),
  database: process.env.PG_DATABASE ?? 'rage_local',
} as const;

export type PGConfig = typeof PG_CONFIG;
```

### Connection

```typescript
// src/client/postgres/connection.ts
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { PGConfig } from './config';

const createPostgresConnection = (
  config: PGConfig,
  logger = false
): NodePgDatabase => {
  const pool = new Pool({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    database: config.database,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });

  return drizzle({ client: pool, logger });
};

export { createPostgresConnection };
```

### Transaction Wrapper

```typescript
// src/client/postgres/transaction.ts
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from 'drizzle-orm/node-postgres';
import type { PgTransaction } from 'drizzle-orm/pg-core';

export type TxType = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, unknown>,
  ExtractTablesWithRelations<Record<string, unknown>>
>;

export const createTransactionWrapper =
  <TSchema extends Record<string, unknown> = Record<string, never>>(
    db: NodePgDatabase<TSchema>
  ) =>
  async <T>(
    fn: (
      tx: PgTransaction<
        NodePgQueryResultHKT,
        TSchema,
        ExtractTablesWithRelations<TSchema>
      >
    ) => Promise<T>
  ): Promise<T> =>
    db.transaction(async (tx) => fn(tx));

type TransactionWrapper = ReturnType<typeof createTransactionWrapper>;
export type { TransactionWrapper };
```

### Index (Exports)

```typescript
// src/client/postgres/index.ts
export { PG_CONFIG, type PGConfig } from './config';
export { createPostgresConnection } from './connection';
export type { TransactionWrapper } from './transaction';
export { createTransactionWrapper } from './transaction';
```

---

## Client: Redis

### Config

```typescript
// src/client/redis/config.ts
const REDIS_CLIENT_CONFIG = {
  url: process.env.REDIS_URL || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  database: parseInt(process.env.REDIS_DB || '0', 10),
  connectTimeout: 10000,
} as const;

export type RedisClientConfig = typeof REDIS_CLIENT_CONFIG;
export default REDIS_CLIENT_CONFIG;
```

### Client Class

```typescript
// src/client/redis/index.ts
import type { RedisClientType } from 'redis';
import { createClient } from 'redis';
import superjson from 'superjson';
import type { RedisClientConfig } from './config';
import type { Logger } from '@/utils/logger';
import type { ResponseResult } from '@/utils/types/result';
import { err, ok } from '@/utils/types/result';
import { RedisErrorCode } from '@/utils/types/error-code';

class RedisClient {
  private client: RedisClientType;
  private logger: Logger;
  private isConnected: boolean = false;

  constructor(config: RedisClientConfig, logger: Logger) {
    const url = `redis://${config.url}:${config.port}`;
    this.logger = logger;
    this.client = createClient({
      url,
      database: config.database,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', { error: err.message });
      this.isConnected = false;
    });
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
  }

  async set(
    key: string,
    value: any,
    expirySeconds?: number
  ): Promise<ResponseResult<undefined>> {
    try {
      await this.ensureConnection();
      const serialized = superjson.stringify(value);
      await this.client.set(
        key,
        serialized,
        expirySeconds ? { EX: expirySeconds } : undefined
      );
      return ok(undefined);
    } catch (e) {
      return err({
        code: RedisErrorCode.EXECUTION_FAILURE,
        message: 'Failed to set key',
      });
    }
  }

  async getWithStructuredResponse<T>(
    key: string
  ): Promise<ResponseResult<T | null>> {
    try {
      await this.ensureConnection();
      const value = await this.client.get(key);
      if (value === null) {
        return ok(null);
      }
      const parsedValue: T = superjson.parse(value);
      return ok(parsedValue);
    } catch (e) {
      return err({
        code: RedisErrorCode.EXECUTION_FAILURE,
        message: 'Failed to get key',
      });
    }
  }

  async del(key: string): Promise<ResponseResult<number>> {
    try {
      await this.ensureConnection();
      const deletedCount = await this.client.del(key);
      return ok(deletedCount);
    } catch (e) {
      return err({
        code: RedisErrorCode.EXECUTION_FAILURE,
        message: 'Failed to delete key',
      });
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export default RedisClient;
export type { RedisClient };
```

---

## Config: App Configuration

```typescript
// src/bootstrap/config.ts
import { PG_CONFIG } from '@/client/postgres/config';
import REDIS_CLIENT_CONFIG from '@/client/redis/config';
import 'dotenv/config';

const SERVICE_CONFIG = {
  companyUser: {
    maxRecordPerJob: process.env.SERVICE_COMPANY_USER_MAX_RECORD_PER_JOB
      ? Number(process.env.SERVICE_COMPANY_USER_MAX_RECORD_PER_JOB)
      : 2000,
  },
} as const;

const APP_CONFIG = {
  postgres: PG_CONFIG,
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    service: process.env.SERVICE_NAME || 'app',
  },
  redis: REDIS_CLIENT_CONFIG,
  service: SERVICE_CONFIG,
};

export default APP_CONFIG;
export type AppConfig = typeof APP_CONFIG;
export type ServiceConfig = typeof SERVICE_CONFIG;
```

---

## Layer 1: Repository

### Purpose

- Direct database access
- Raw data queries and mutations
- Error wrapping

### What Repository CAN Do

- Execute database queries (select, insert, update, delete)
- Transform database rows to domain types
- Wrap database errors in `ResponseResult`

### What Repository CANNOT Do

- Access HTTP context
- Make authorization decisions
- Call other repositories directly
- Contain business logic

### Factory Pattern

```typescript
// src/repository/index.ts
interface Deps {
  db: NodePgDatabase;
  logger: Logger;
  cache: RedisClient;
}

const repositories = ({ db, logger, cache }: Deps) => {
  const sessionRepository = new SessionRepository({ db, logger });
  const configRepository = new ConfigRepository({ db, logger, cache });

  return {
    sessionRepository,
    configRepository,
  };
};

export type Repositories = ReturnType<typeof repositories>;
export default repositories;
```

### Repository Class Pattern

```typescript
// src/repository/{domain}/index.ts
interface Deps {
  db: NodePgDatabase;
  logger: Logger;
}

class SessionRepository {
  private db: NodePgDatabase;
  private logger: Logger;

  constructor({ db, logger }: Deps) {
    this.db = db;
    this.logger = logger;
  }

  // Read: uses this.db
  async findById(id: string): Promise<ResponseResult<Session>> {
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, id))
        .limit(1);

      if (result.length === 0) {
        return {
          ok: false,
          error: { code: ErrorCode.NotFound, message: 'Session not found' },
        };
      }

      return { ok: true, data: result[0] };
    } catch (e) {
      this.logger.error('Failed to find session', e);
      return {
        ok: false,
        error: { code: ErrorCode.InternalError, message: 'Database error' },
      };
    }
  }

  // Write: accepts tx as first parameter
  async create(tx: TxType, data: NewSession): Promise<ResponseResult<Session>> {
    try {
      const result = await tx.insert(sessions).values(data).returning();

      if (result.length === 0) {
        return {
          ok: false,
          error: { code: ErrorCode.InternalError, message: 'Insert failed' },
        };
      }

      return { ok: true, data: result[0] };
    } catch (e) {
      this.logger.error('Failed to create session', e);
      return {
        ok: false,
        error: { code: ErrorCode.InternalError, message: 'Database error' },
      };
    }
  }
}

export default SessionRepository;
```

---

## Layer 2: Usecase

### Purpose

- Business logic
- Authorization checks
- Orchestrate multiple repositories
- Manage transactions

### What Usecase CAN Do

- Call repositories
- Make business decisions
- Check user permissions/ownership
- Use transactions for atomic operations

### What Usecase CANNOT Do

- Access HTTP context or request/response
- Know about HTTP status codes

### Factory Pattern

```typescript
// src/usecase/index.ts
interface Deps {
  repositories: Repositories;
  txWrapper: TransactionWrapper;
  logger: Logger;
}

const usecases = ({ repositories, txWrapper, logger }: Deps) => {
  const session = new SessionUsecase({
    sessionRepository: repositories.sessionRepository,
    txWrapper,
    logger,
  });

  return {
    session,
  };
};

export type Usecases = ReturnType<typeof usecases>;
export default usecases;
```

### Usecase Class Pattern

```typescript
// src/usecase/{domain}.ts
interface Deps {
  sessionRepository: SessionRepository;
  txWrapper: TransactionWrapper;
  logger: Logger;
}

class SessionUsecase {
  private sessionRepository: SessionRepository;
  private txWrapper: TransactionWrapper;
  private logger: Logger;

  constructor({ sessionRepository, txWrapper, logger }: Deps) {
    this.sessionRepository = sessionRepository;
    this.txWrapper = txWrapper;
    this.logger = logger;
  }

  // Without transaction
  async getById(userId: number, sessionId: string): Promise<ResponseResult<Session>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session.ok) {
      return session;
    }

    if (session.data.userId !== userId) {
      return {
        ok: false,
        error: { code: ErrorCode.Forbidden, message: 'Access denied' },
      };
    }

    return { ok: true, data: session.data };
  }

  // With transaction
  async create(userId: number, title: string): Promise<ResponseResult<string>> {
    return this.txWrapper(async (tx) => {
      const session = await this.sessionRepository.create(tx, { userId, title });
      if (!session.ok) {
        return session;
      }

      return { ok: true, data: session.data.id };
    });
  }
}

export default SessionUsecase;
```

---

## Layer 3: Service

### Purpose

- Bridge between HTTP and business logic
- Extract identity from HTTP context
- Map business errors to HTTP status codes
- Catch and handle exceptions

### What Service CAN Do

- Access HTTP context (to extract identity)
- Call usecases
- Map `ResponseResult` errors to HTTP status codes
- Catch exceptions and return 500 errors

### What Service CANNOT Do

- Access database directly
- Contain business logic
- Call repositories

### Factory Pattern

```typescript
// src/services/index.ts
interface Deps {
  usecases: Usecases;
  logger: Logger;
}

const services = ({ usecases, logger }: Deps) => {
  const sessionService = new SessionService({
    sessionUsecase: usecases.session,
  });

  return {
    sessionService,
  };
};

export type Services = ReturnType<typeof services>;
export default services;
```

### Service Class Pattern

```typescript
// src/services/{domain}.service.ts
interface Deps {
  sessionUsecase: SessionUsecase;
}

class SessionService {
  private sessionUsecase: SessionUsecase;

  constructor({ sessionUsecase }: Deps) {
    this.sessionUsecase = sessionUsecase;
  }

  async handleGetSession(c: Context, id: string): Promise<ServiceResult<Session>> {
    try {
      const identity = getIdentity(c);
      if (!identity) {
        return toServiceError(
          { code: ErrorCode.Unauthorized, message: 'Not authenticated' },
          401
        );
      }

      const result = await this.sessionUsecase.getById(identity.userId, id);

      if (!result.ok) {
        const statusMap: Record<string, number> = {
          [ErrorCode.NotFound]: 404,
          [ErrorCode.Forbidden]: 403,
        };
        return toServiceError(result.error, statusMap[result.error.code] || 400);
      }

      return toServiceSuccess(result.data);
    } catch (e) {
      return toServiceException(e, 'Failed to get session', 500);
    }
  }
}

export default SessionService;
```

---

## Layer 4: Router

### Purpose

- HTTP entry point
- Request validation (via OpenAPI/Zod)
- Response formatting

### Initialization (No Factory)

```typescript
// In Container.initRoutes()
new SessionRouter(this.hono, this.services.sessionService);
```

### Router Class Pattern

```typescript
// src/routes/{domain}.router.ts
class SessionRouter {
  constructor(
    private app: OpenAPIHono,
    private sessionService: SessionService
  ) {
    this.registerRoutes();
  }

  private registerRoutes() {
    this.app.openapi(
      extendRoute({ ...GetSessionRoute, security: [{ Bearer: [] }] }),
      async (c) => {
        const { id } = c.req.valid('param');

        const result = await this.sessionService.handleGetSession(c, id);

        if (!result.ok) {
          return handleServiceError(c, result);
        }

        return c.json(result.data, 200);
      }
    );
  }
}

export default SessionRouter;
```

---

## Container (Dependency Injection)

```typescript
// src/bootstrap/container.ts
import repositories, { type Repositories } from '@/repository';
import usecases, { type Usecases } from '@/usecase';
import services, { type Services } from '@/services';

export class Container {
  private static instance: Container;

  private repositories: Repositories;
  private usecases: Usecases;
  private services: Services;

  public hono: OpenAPIHono;

  private constructor() {
    this.hono = new OpenAPIHono();
    this.appConfig = APP_CONFIG;
    this.logger = createLogger(this.appConfig.logger);

    // Clients
    this.dbClient = createPostgresConnection(this.appConfig.postgres);
    this.redisClient = new RedisClient(this.appConfig.redis, this.logger);

    // Repositories (factory)
    this.repositories = repositories({
      db: this.dbClient,
      logger: this.logger,
      cache: this.redisClient,
    });

    // Transaction wrapper
    this.txWrapper = createTransactionWrapper(this.dbClient);

    // Usecases (factory)
    this.usecases = usecases({
      repositories: this.repositories,
      txWrapper: this.txWrapper,
      logger: this.logger,
    });

    // Services (factory)
    this.services = services({
      usecases: this.usecases,
      logger: this.logger,
    });

    // Routes (no factory)
    this.initRoutes();
  }

  private initRoutes() {
    new SessionRouter(this.hono, this.services.sessionService);
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public getUsecases(): Usecases {
    return this.usecases;
  }
}
```

---

## Transaction Flow

```
Usecase.create()
    │
    ▼
txWrapper(async (tx) => {           ◄── Transaction starts
    │
    ├── sessionRepo.create(tx, data)
    │       └── tx.insert(sessions)  ◄── Uses transaction
    │
    ├── if (!session.ok) return      ◄── Early return = rollback
    │
    ├── messageRepo.create(tx, data)
    │       └── tx.insert(messages)  ◄── Same transaction
    │
    ├── if (!message.ok) return      ◄── Early return = rollback
    │
    ▼
    return { ok: true, data }        ◄── Transaction commits
})
```

---

## Testing

### Testing Usecase

```typescript
describe('SessionUsecase', () => {
  let usecase: SessionUsecase;
  let mockSessionRepo: jest.Mocked<SessionRepository>;
  let mockTxWrapper: jest.Mock;

  beforeEach(() => {
    mockSessionRepo = {
      findById: jest.fn(),
      create: jest.fn(),
    } as any;

    mockTxWrapper = jest.fn((fn) => fn({}));

    usecase = new SessionUsecase({
      sessionRepository: mockSessionRepo,
      txWrapper: mockTxWrapper,
      logger: mockLogger,
    });
  });

  it('should return forbidden when user does not own session', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      ok: true,
      data: { id: '123', userId: 999 },
    });

    const result = await usecase.getById(1, '123');

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('FORBIDDEN');
  });
});
```

### Testing Service

```typescript
jest.mock('@/utils/helpers/context');
const mockGetIdentity = getIdentity as jest.Mock;

describe('SessionService', () => {
  let service: SessionService;
  let mockUsecase: jest.Mocked<SessionUsecase>;

  beforeEach(() => {
    mockUsecase = { getById: jest.fn() } as any;
    service = new SessionService({ sessionUsecase: mockUsecase });
  });

  it('should return 401 when not authenticated', async () => {
    mockGetIdentity.mockReturnValue(undefined);

    const result = await service.handleGetSession({} as any, '123');

    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });
});
```

### Running Tests

```bash
pnpm test                    # Run all tests
pnpm test:watch              # Watch mode
pnpm test:coverage           # With coverage
```

---

## Testing via Script

```typescript
// scripts/test-session.ts
import { Container } from '@/bootstrap/container';

async function main() {
  const container = Container.getInstance();
  const usecases = container.getUsecases();

  const result = await usecases.session.getById(1, 'session-id');

  if (!result.ok) {
    console.error('Error:', result.error);
    process.exit(1);
  }

  console.log('Session:', result.data);
}

main().catch(console.error);
```

```bash
bun run scripts/test-session.ts
```

---

## Database Schema (Drizzle)

```typescript
// src/entity/{domain}/schema.ts
import { pgTable, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

// ULID helper
const ulidPK = (name: string = 'id') =>
  varchar(name, { length: 26 }).primaryKey().$defaultFn(() => ulid());

const ulidFK = (name: string) =>
  varchar(name, { length: 26 });

export const sessions = pgTable(
  'sessions',
  {
    id: ulidPK(),
    userId: ulidFK('user_id').notNull(),
    title: text('title').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
  ]
);
```

```bash
pnpm db:generate   # Generate migration
pnpm db:migrate    # Run migrations
pnpm db:push       # Push schema (dev)
pnpm db:studio     # Drizzle Studio
```

---

## Summary

| Layer | Location | Factory | Receives | Returns |
|-------|----------|---------|----------|---------|
| Repository | `src/repository/` | `index.ts` | DB, Logger, Cache | `ResponseResult<T>` |
| Usecase | `src/usecase/` | `index.ts` | Repositories, TxWrapper | `ResponseResult<T>` |
| Service | `src/services/` | `index.ts` | Usecases, Logger | `ServiceResult<T>` |
| Router | `src/routes/` | None | App, Services | HTTP Response |
