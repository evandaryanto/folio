import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/providers";
import { compositionsService } from "@/services/compositions";
import type {
  CreateCompositionRequest,
  UpdateCompositionRequest,
  PreviewCompositionRequest,
} from "@folio/contract/composition";

export const compositionKeys = {
  all: ["compositions"] as const,
  lists: () => [...compositionKeys.all, "list"] as const,
  list: (workspaceId: string) =>
    [...compositionKeys.lists(), workspaceId] as const,
  details: () => [...compositionKeys.all, "detail"] as const,
  detail: (workspaceId: string, compositionId: string) =>
    [...compositionKeys.details(), workspaceId, compositionId] as const,
  bySlug: (workspaceId: string, slug: string) =>
    [...compositionKeys.all, "slug", workspaceId, slug] as const,
};

export function useCompositions() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: compositionKeys.list(workspaceId ?? ""),
    queryFn: async () => {
      if (!workspaceId) throw new Error("No workspace");
      const response = await compositionsService.list(workspaceId);
      return response.compositions;
    },
    enabled: !!workspaceId,
  });
}

export function useComposition(compositionId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: compositionKeys.detail(workspaceId ?? "", compositionId ?? ""),
    queryFn: async () => {
      if (!workspaceId || !compositionId) throw new Error("Missing params");
      const response = await compositionsService.get(
        workspaceId,
        compositionId,
      );
      return response.composition;
    },
    enabled: !!workspaceId && !!compositionId,
  });
}

export function useCompositionBySlug(slug: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: compositionKeys.bySlug(workspaceId ?? "", slug ?? ""),
    queryFn: async () => {
      if (!workspaceId || !slug) throw new Error("Missing params");
      const response = await compositionsService.getBySlug(workspaceId, slug);
      return response.composition;
    },
    enabled: !!workspaceId && !!slug,
  });
}

export function useCreateComposition() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCompositionRequest) => {
      if (!workspaceId) throw new Error("No workspace");
      const response = await compositionsService.create(workspaceId, data);
      return response.composition;
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: compositionKeys.list(workspaceId),
        });
      }
    },
  });
}

export function useUpdateComposition(compositionId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCompositionRequest) => {
      if (!workspaceId || !compositionId) throw new Error("Missing params");
      const response = await compositionsService.update(
        workspaceId,
        compositionId,
        data,
      );
      return response.composition;
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: compositionKeys.list(workspaceId),
        });
        if (compositionId) {
          queryClient.invalidateQueries({
            queryKey: compositionKeys.detail(workspaceId, compositionId),
          });
        }
      }
    },
  });
}

export function useDeleteComposition() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (compositionId: string) => {
      if (!workspaceId) throw new Error("No workspace");
      await compositionsService.delete(workspaceId, compositionId);
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: compositionKeys.list(workspaceId),
        });
      }
    },
  });
}

export function useExecuteComposition(
  workspaceSlug: string | undefined,
  compositionSlug: string | undefined,
) {
  return useQuery({
    queryKey: ["composition-execute", workspaceSlug, compositionSlug],
    queryFn: async () => {
      if (!workspaceSlug || !compositionSlug) throw new Error("Missing params");
      return compositionsService.execute(workspaceSlug, compositionSlug);
    },
    enabled: false, // Manual trigger only
  });
}

export function usePreviewComposition() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useMutation({
    mutationFn: async (data: PreviewCompositionRequest) => {
      if (!workspaceId) throw new Error("No workspace");
      return compositionsService.preview(workspaceId, data);
    },
  });
}
