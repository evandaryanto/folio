import { api } from "./api";
import type {
  ListRecordsResponse,
  GetRecordResponse,
  CreateRecordResponse,
  UpdateRecordResponse,
  DeleteRecordResponse,
} from "@folio/contract/record";
import type {
  CreateRecordRequest,
  UpdateRecordRequest,
} from "@folio/contract/record";

export const recordsService = {
  list: (
    workspaceId: string,
    collectionId: string,
    params?: { cursor?: string; limit?: number },
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.set("cursor", params.cursor);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    const query = searchParams.toString();
    return api.get<ListRecordsResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}/records${query ? `?${query}` : ""}`,
    );
  },

  get: (workspaceId: string, collectionId: string, recordId: string) =>
    api.get<GetRecordResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}/records/${recordId}`,
    ),

  create: (
    workspaceId: string,
    collectionId: string,
    data: CreateRecordRequest,
  ) =>
    api.post<CreateRecordResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}/records`,
      data,
    ),

  update: (
    workspaceId: string,
    collectionId: string,
    recordId: string,
    data: UpdateRecordRequest,
  ) =>
    api.patch<UpdateRecordResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}/records/${recordId}`,
      data,
    ),

  delete: (workspaceId: string, collectionId: string, recordId: string) =>
    api.delete<DeleteRecordResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}/records/${recordId}`,
    ),
};
