import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/providers";
import { collectionsService } from "@/services/collections";
import type { CreateCollectionRequest } from "@folio/contract/collection";

// Query keys
export const collectionKeys = {
  all: ["collections"] as const,
  lists: () => [...collectionKeys.all, "list"] as const,
  list: (workspaceId: string) =>
    [...collectionKeys.lists(), workspaceId] as const,
  details: () => [...collectionKeys.all, "detail"] as const,
  detail: (workspaceId: string, slug: string) =>
    [...collectionKeys.details(), workspaceId, slug] as const,
};

export function useCollections() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: collectionKeys.list(workspaceId ?? ""),
    queryFn: async () => {
      if (!workspaceId) throw new Error("No workspace");
      const response = await collectionsService.list(workspaceId);
      return response.collections;
    },
    enabled: !!workspaceId,
  });
}

export function useCollection(slug: string) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: collectionKeys.detail(workspaceId ?? "", slug),
    queryFn: async () => {
      if (!workspaceId) throw new Error("No workspace");
      const response = await collectionsService.getBySlug(workspaceId, slug);
      return response.collection;
    },
    enabled: !!workspaceId && !!slug,
  });
}

export function useCreateCollection() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCollectionRequest) => {
      if (!workspaceId) throw new Error("No workspace");
      const response = await collectionsService.create(workspaceId, data);
      return response.collection;
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: collectionKeys.list(workspaceId),
        });
      }
    },
  });
}

export function useDeleteCollection() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      if (!workspaceId) throw new Error("No workspace");
      await collectionsService.delete(workspaceId, collectionId);
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: collectionKeys.list(workspaceId),
        });
      }
    },
  });
}
