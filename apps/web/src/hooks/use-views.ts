import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/providers";
import { viewsService } from "@/services/views";
import type {
  CreateViewRequest,
  UpdateViewRequest,
} from "@folio/contract/view";

export const viewKeys = {
  all: ["views"] as const,
  lists: () => [...viewKeys.all, "list"] as const,
  list: (workspaceId: string) =>
    [...viewKeys.lists(), workspaceId] as const,
  details: () => [...viewKeys.all, "detail"] as const,
  detail: (workspaceId: string, viewId: string) =>
    [...viewKeys.details(), workspaceId, viewId] as const,
  bySlug: (workspaceId: string, slug: string) =>
    [...viewKeys.all, "slug", workspaceId, slug] as const,
};

export function useViews() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: viewKeys.list(workspaceId ?? ""),
    queryFn: async () => {
      if (!workspaceId) throw new Error("No workspace");
      const response = await viewsService.list(workspaceId);
      return response.views;
    },
    enabled: !!workspaceId,
  });
}

export function useView(viewId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: viewKeys.detail(workspaceId ?? "", viewId ?? ""),
    queryFn: async () => {
      if (!workspaceId || !viewId) throw new Error("Missing params");
      const response = await viewsService.get(workspaceId, viewId);
      return response.view;
    },
    enabled: !!workspaceId && !!viewId,
  });
}

export function useViewBySlug(slug: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: viewKeys.bySlug(workspaceId ?? "", slug ?? ""),
    queryFn: async () => {
      if (!workspaceId || !slug) throw new Error("Missing params");
      const response = await viewsService.getBySlug(workspaceId, slug);
      return response.view;
    },
    enabled: !!workspaceId && !!slug,
  });
}

export function useCreateView() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateViewRequest) => {
      if (!workspaceId) throw new Error("No workspace");
      const response = await viewsService.create(workspaceId, data);
      return response.view;
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: viewKeys.list(workspaceId),
        });
      }
    },
  });
}

export function useUpdateView(viewId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateViewRequest) => {
      if (!workspaceId || !viewId) throw new Error("Missing params");
      const response = await viewsService.update(
        workspaceId,
        viewId,
        data,
      );
      return response.view;
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: viewKeys.list(workspaceId),
        });
        if (viewId) {
          queryClient.invalidateQueries({
            queryKey: viewKeys.detail(workspaceId, viewId),
          });
        }
      }
    },
  });
}

export function useDeleteView() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (viewId: string) => {
      if (!workspaceId) throw new Error("No workspace");
      await viewsService.delete(workspaceId, viewId);
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: viewKeys.list(workspaceId),
        });
      }
    },
  });
}
