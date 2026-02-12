import { api } from "./api";
import type {
  ListFieldsResponse,
  GetFieldResponse,
  CreateFieldResponse,
  UpdateFieldResponse,
  DeleteFieldResponse,
} from "@folio/contract/field";
import type {
  CreateFieldRequest,
  UpdateFieldRequest,
} from "@folio/contract/field";

export const fieldsService = {
  list: (workspaceId: string, collectionId: string) =>
    api.get<ListFieldsResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}/fields`,
    ),

  get: (workspaceId: string, collectionId: string, fieldId: string) =>
    api.get<GetFieldResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}/fields/${fieldId}`,
    ),

  create: (
    workspaceId: string,
    collectionId: string,
    data: CreateFieldRequest,
  ) =>
    api.post<CreateFieldResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}/fields`,
      data,
    ),

  update: (
    workspaceId: string,
    collectionId: string,
    fieldId: string,
    data: UpdateFieldRequest,
  ) =>
    api.patch<UpdateFieldResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}/fields/${fieldId}`,
      data,
    ),

  delete: (workspaceId: string, collectionId: string, fieldId: string) =>
    api.delete<DeleteFieldResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}/fields/${fieldId}`,
    ),
};
