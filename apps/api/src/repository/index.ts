import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import type { Logger } from "@/utils/logger";

// Core
import { WorkspaceRepository } from "./workspace";
import { UserRepository } from "./user";
import { SessionRepository } from "./session";
import { RoleRepository } from "./role";
import { UserRoleRepository } from "./user-role";

// Collections & Records
import { CollectionRepository } from "./collection";
import { FieldRepository } from "./field";
import { RecordRepository } from "./record";

// APIs & Compositions
import { ApiRepository } from "./api";
import { CompositionRepository } from "./composition";

// Views
import { ViewRepository } from "./view";

// Pages
import { PageRepository } from "./page";

// Access & Security
import { ApiKeyRepository } from "./api-key";
import { AccessRuleRepository } from "./access-rule";
import { AuditLogRepository } from "./audit-log";

interface CreateRepositoriesDeps {
  db: NodePgDatabase;
  pool: Pool;
  logger: Logger;
}

export function createRepositories({
  db,
  pool,
  logger,
}: CreateRepositoriesDeps) {
  return {
    // Core
    workspace: new WorkspaceRepository({ db, logger }),
    user: new UserRepository({ db, logger }),
    session: new SessionRepository({ db, logger }),
    role: new RoleRepository({ db, logger }),
    userRole: new UserRoleRepository({ db, logger }),
    // Collections & Records
    collection: new CollectionRepository({ db, logger }),
    field: new FieldRepository({ db, logger }),
    record: new RecordRepository({ db, pool, logger }),
    // APIs & Compositions
    api: new ApiRepository({ db, logger }),
    composition: new CompositionRepository({ db, logger }),
    // Views
    view: new ViewRepository({ db, logger }),
    // Pages
    page: new PageRepository({ db, logger }),
    // Access & Security
    apiKey: new ApiKeyRepository({ db, logger }),
    accessRule: new AccessRuleRepository({ db, logger }),
    auditLog: new AuditLogRepository({ db, logger }),
  };
}
type Repositories = ReturnType<typeof createRepositories>;
export default createRepositories;
export type { Repositories };
