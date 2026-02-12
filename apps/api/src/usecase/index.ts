import type { Repositories } from "@/repository";
import type { Logger } from "@/utils/logger";
import type { TransactionWrapper } from "@/client/postgres/transaction";

import { AuthUsecase } from "./auth";
import { WorkspaceUsecase } from "./workspace";
import { CollectionUsecase } from "./collection";
import { FieldUsecase } from "./field";
import { RecordUsecase } from "./record";
import { ApiUsecase } from "./api";
import { CompositionUsecase } from "./composition";
import { ViewUsecase } from "./view";
import { PageUsecase } from "./page";
import { ApiKeyUsecase } from "./api-key";
import { AccessRuleUsecase } from "./access-rule";

interface CreateUsecasesDeps {
  repositories: Repositories;
  txWrapper: TransactionWrapper;
  logger: Logger;
}

export function createUsecases({
  repositories,
  txWrapper,
  logger,
}: CreateUsecasesDeps) {
  return {
    auth: new AuthUsecase({
      userRepository: repositories.user,
      workspaceRepository: repositories.workspace,
      sessionRepository: repositories.session,
      txWrapper,
      logger,
    }),
    workspace: new WorkspaceUsecase({
      workspaceRepository: repositories.workspace,
      logger,
    }),
    collection: new CollectionUsecase({
      collectionRepository: repositories.collection,
      logger,
    }),
    field: new FieldUsecase({
      fieldRepository: repositories.field,
      collectionRepository: repositories.collection,
      logger,
    }),
    record: new RecordUsecase({
      recordRepository: repositories.record,
      collectionRepository: repositories.collection,
      fieldRepository: repositories.field,
      txWrapper,
      logger,
    }),
    api: new ApiUsecase({
      apiRepository: repositories.api,
      logger,
    }),
    composition: new CompositionUsecase({
      compositionRepository: repositories.composition,
      collectionRepository: repositories.collection,
      workspaceRepository: repositories.workspace,
      recordRepository: repositories.record,
      logger,
    }),
    view: new ViewUsecase({
      viewRepository: repositories.view,
      logger,
    }),
    page: new PageUsecase({
      pageRepository: repositories.page,
      workspaceRepository: repositories.workspace,
      logger,
    }),
    apiKey: new ApiKeyUsecase({
      apiKeyRepository: repositories.apiKey,
      logger,
    }),
    accessRule: new AccessRuleUsecase({
      accessRuleRepository: repositories.accessRule,
      logger,
    }),
  };
}

export type Usecases = ReturnType<typeof createUsecases>;
