import { api } from "./api";
import type {
  ListPagesResponse,
  GetPageResponse,
  CreatePageResponse,
  UpdatePageResponse,
  DeletePageResponse,
  CreatePageRequest,
  UpdatePageRequest,
} from "@folio/contract/page";

export const pagesService = {
  list: (workspaceId: string) =>
    api.get<ListPagesResponse>(`/workspaces/${workspaceId}/pages`),

  get: (workspaceId: string, pageId: string) =>
    api.get<GetPageResponse>(`/workspaces/${workspaceId}/pages/${pageId}`),

  getBySlug: (workspaceId: string, slug: string) =>
    api.get<GetPageResponse>(`/workspaces/${workspaceId}/pages/slug/${slug}`),

  create: (workspaceId: string, data: CreatePageRequest) =>
    api.post<CreatePageResponse>(`/workspaces/${workspaceId}/pages`, data),

  update: (workspaceId: string, pageId: string, data: UpdatePageRequest) =>
    api.patch<UpdatePageResponse>(
      `/workspaces/${workspaceId}/pages/${pageId}`,
      data,
    ),

  delete: (workspaceId: string, pageId: string) =>
    api.delete<DeletePageResponse>(
      `/workspaces/${workspaceId}/pages/${pageId}`,
    ),

  getPublic: (workspaceSlug: string, pageSlug: string) =>
    api.get<GetPageResponse>(`/p/${workspaceSlug}/${pageSlug}`),
};
