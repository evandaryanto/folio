import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/providers";
import { fieldsService } from "@/services/fields";
import type { CreateFieldRequest, UpdateFieldRequest } from "@folio/contract/field";

export const fieldKeys = {
  all: ["fields"] as const,
  lists: () => [...fieldKeys.all, "list"] as const,
  list: (workspaceId: string, collectionId: string) =>
    [...fieldKeys.lists(), workspaceId, collectionId] as const,
};

export function useFields(collectionId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: fieldKeys.list(workspaceId ?? "", collectionId ?? ""),
    queryFn: async () => {
      if (!workspaceId || !collectionId) throw new Error("Missing params");
      const response = await fieldsService.list(workspaceId, collectionId);
      return response.fields;
    },
    enabled: !!workspaceId && !!collectionId,
  });
}

export function useCreateField(collectionId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFieldRequest) => {
      if (!workspaceId || !collectionId) throw new Error("Missing params");
      const response = await fieldsService.create(
        workspaceId,
        collectionId,
        data,
      );
      return response.field;
    },
    onSuccess: () => {
      if (workspaceId && collectionId) {
        queryClient.invalidateQueries({
          queryKey: fieldKeys.list(workspaceId, collectionId),
        });
      }
    },
  });
}

export function useUpdateField(collectionId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fieldId,
      data,
    }: {
      fieldId: string;
      data: UpdateFieldRequest;
    }) => {
      if (!workspaceId || !collectionId) throw new Error("Missing params");
      const response = await fieldsService.update(
        workspaceId,
        collectionId,
        fieldId,
        data,
      );
      return response.field;
    },
    onSuccess: () => {
      if (workspaceId && collectionId) {
        queryClient.invalidateQueries({
          queryKey: fieldKeys.list(workspaceId, collectionId),
        });
      }
    },
  });
}

export function useDeleteField(collectionId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fieldId: string) => {
      if (!workspaceId || !collectionId) throw new Error("Missing params");
      await fieldsService.delete(workspaceId, collectionId, fieldId);
    },
    onSuccess: () => {
      if (workspaceId && collectionId) {
        queryClient.invalidateQueries({
          queryKey: fieldKeys.list(workspaceId, collectionId),
        });
      }
    },
  });
}
