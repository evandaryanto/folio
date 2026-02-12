import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/providers";
import { recordsService } from "@/services/records";

export const recordKeys = {
  all: ["records"] as const,
  lists: () => [...recordKeys.all, "list"] as const,
  list: (workspaceId: string, collectionId: string) =>
    [...recordKeys.lists(), workspaceId, collectionId] as const,
};

export function useRecords(collectionId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: recordKeys.list(workspaceId ?? "", collectionId ?? ""),
    queryFn: async () => {
      if (!workspaceId || !collectionId) throw new Error("Missing params");
      const response = await recordsService.list(workspaceId, collectionId);
      return response.records;
    },
    enabled: !!workspaceId && !!collectionId,
  });
}

export function useCreateRecord(collectionId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (!workspaceId || !collectionId) throw new Error("Missing params");
      const response = await recordsService.create(workspaceId, collectionId, {
        data,
      });
      return response.record;
    },
    onSuccess: () => {
      if (workspaceId && collectionId) {
        queryClient.invalidateQueries({
          queryKey: recordKeys.list(workspaceId, collectionId),
        });
      }
    },
  });
}

export function useBulkCreateRecords(collectionId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (records: Array<{ data: Record<string, unknown> }>) => {
      if (!workspaceId || !collectionId) throw new Error("Missing params");
      const response = await recordsService.bulkCreate(
        workspaceId,
        collectionId,
        { records },
      );
      return response;
    },
    onSuccess: () => {
      if (workspaceId && collectionId) {
        queryClient.invalidateQueries({
          queryKey: recordKeys.list(workspaceId, collectionId),
        });
      }
    },
  });
}

export function useDeleteRecord(collectionId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordId: string) => {
      if (!workspaceId || !collectionId) throw new Error("Missing params");
      await recordsService.delete(workspaceId, collectionId, recordId);
    },
    onSuccess: () => {
      if (workspaceId && collectionId) {
        queryClient.invalidateQueries({
          queryKey: recordKeys.list(workspaceId, collectionId),
        });
      }
    },
  });
}
