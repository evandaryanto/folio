import { api } from "./api";
import type {
  ListCollectionsResponse,
  GetCollectionResponse,
  CreateCollectionResponse,
  UpdateCollectionResponse,
  DeleteCollectionResponse,
} from "@folio/contract/collection";
import type {
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from "@folio/contract/collection";

export const collectionsService = {
  list: (workspaceId: string) =>
    api.get<ListCollectionsResponse>(`/workspaces/${workspaceId}/collections`),

  get: (workspaceId: string, collectionId: string) =>
    api.get<GetCollectionResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}`,
    ),

  getBySlug: (workspaceId: string, slug: string) =>
    api.get<GetCollectionResponse>(
      `/workspaces/${workspaceId}/collections/slug/${slug}`,
    ),

  create: (workspaceId: string, data: CreateCollectionRequest) =>
    api.post<CreateCollectionResponse>(
      `/workspaces/${workspaceId}/collections`,
      data,
    ),

  update: (
    workspaceId: string,
    collectionId: string,
    data: UpdateCollectionRequest,
  ) =>
    api.patch<UpdateCollectionResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}`,
      data,
    ),

  delete: (workspaceId: string, collectionId: string) =>
    api.delete<DeleteCollectionResponse>(
      `/workspaces/${workspaceId}/collections/${collectionId}`,
    ),
};
