import type { Usecases } from "@/usecase";

import { AuthService } from "./auth";
import { WorkspaceService } from "./workspace";
import { CollectionService } from "./collection";
import { FieldService } from "./field";
import { RecordService } from "./record";
import { ApiService } from "./api";
import { CompositionService } from "./composition";
import { ApiKeyService } from "./api-key";
import { AccessRuleService } from "./access-rule";

interface CreateServicesDeps {
  usecases: Usecases;
}

export function createServices({ usecases }: CreateServicesDeps) {
  return {
    auth: new AuthService({ authUsecase: usecases.auth }),
    workspace: new WorkspaceService({ workspaceUsecase: usecases.workspace }),
    collection: new CollectionService({
      collectionUsecase: usecases.collection,
    }),
    field: new FieldService({ fieldUsecase: usecases.field }),
    record: new RecordService({ recordUsecase: usecases.record }),
    api: new ApiService({ apiUsecase: usecases.api }),
    composition: new CompositionService({
      compositionUsecase: usecases.composition,
    }),
    apiKey: new ApiKeyService({ apiKeyUsecase: usecases.apiKey }),
    accessRule: new AccessRuleService({
      accessRuleUsecase: usecases.accessRule,
    }),
  };
}

export type Services = ReturnType<typeof createServices>;
