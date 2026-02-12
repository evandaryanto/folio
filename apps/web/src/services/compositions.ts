import { api } from "./api";
import type {
  ListCompositionsResponse,
  GetCompositionResponse,
  CreateCompositionResponse,
  UpdateCompositionResponse,
  DeleteCompositionResponse,
  CreateCompositionRequest,
  UpdateCompositionRequest,
  PreviewCompositionRequest,
  PreviewCompositionResponse,
} from "@folio/contract/composition";

export const compositionsService = {
  list: (workspaceId: string) =>
    api.get<ListCompositionsResponse>(
      `/workspaces/${workspaceId}/compositions`,
    ),

  get: (workspaceId: string, compositionId: string) =>
    api.get<GetCompositionResponse>(
      `/workspaces/${workspaceId}/compositions/${compositionId}`,
    ),

  getBySlug: (workspaceId: string, slug: string) =>
    api.get<GetCompositionResponse>(
      `/workspaces/${workspaceId}/compositions/slug/${slug}`,
    ),

  create: (workspaceId: string, data: CreateCompositionRequest) =>
    api.post<CreateCompositionResponse>(
      `/workspaces/${workspaceId}/compositions`,
      data,
    ),

  update: (
    workspaceId: string,
    compositionId: string,
    data: UpdateCompositionRequest,
  ) =>
    api.patch<UpdateCompositionResponse>(
      `/workspaces/${workspaceId}/compositions/${compositionId}`,
      data,
    ),

  delete: (workspaceId: string, compositionId: string) =>
    api.delete<DeleteCompositionResponse>(
      `/workspaces/${workspaceId}/compositions/${compositionId}`,
    ),

  execute: (
    workspaceSlug: string,
    compositionSlug: string,
    params?: Record<string, unknown>,
  ) => {
    const searchParams = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : "";
    return api.get<{
      data: Record<string, unknown>[];
      metadata: { count: number };
    }>(`/c/${workspaceSlug}/${compositionSlug}${searchParams}`);
  },

  preview: (workspaceId: string, data: PreviewCompositionRequest) =>
    api.post<PreviewCompositionResponse>(
      `/workspaces/${workspaceId}/compositions/preview`,
      data,
    ),
};
