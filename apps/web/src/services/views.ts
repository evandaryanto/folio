import { api } from "./api";
import type {
  ListViewsResponse,
  GetViewResponse,
  CreateViewResponse,
  UpdateViewResponse,
  DeleteViewResponse,
  CreateViewRequest,
  UpdateViewRequest,
} from "@folio/contract/view";

export const viewsService = {
  list: (workspaceId: string) =>
    api.get<ListViewsResponse>(`/workspaces/${workspaceId}/views`),

  get: (workspaceId: string, viewId: string) =>
    api.get<GetViewResponse>(`/workspaces/${workspaceId}/views/${viewId}`),

  getBySlug: (workspaceId: string, slug: string) =>
    api.get<GetViewResponse>(`/workspaces/${workspaceId}/views/slug/${slug}`),

  create: (workspaceId: string, data: CreateViewRequest) =>
    api.post<CreateViewResponse>(`/workspaces/${workspaceId}/views`, data),

  update: (workspaceId: string, viewId: string, data: UpdateViewRequest) =>
    api.patch<UpdateViewResponse>(
      `/workspaces/${workspaceId}/views/${viewId}`,
      data,
    ),

  delete: (workspaceId: string, viewId: string) =>
    api.delete<DeleteViewResponse>(
      `/workspaces/${workspaceId}/views/${viewId}`,
    ),
};
