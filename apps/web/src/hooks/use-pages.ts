import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/providers";
import { pagesService } from "@/services/pages";
import type {
  CreatePageRequest,
  UpdatePageRequest,
} from "@folio/contract/page";

export const pageKeys = {
  all: ["pages"] as const,
  lists: () => [...pageKeys.all, "list"] as const,
  list: (workspaceId: string) =>
    [...pageKeys.lists(), workspaceId] as const,
  details: () => [...pageKeys.all, "detail"] as const,
  detail: (workspaceId: string, pageId: string) =>
    [...pageKeys.details(), workspaceId, pageId] as const,
  bySlug: (workspaceId: string, slug: string) =>
    [...pageKeys.all, "slug", workspaceId, slug] as const,
};

export function usePages() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: pageKeys.list(workspaceId ?? ""),
    queryFn: async () => {
      if (!workspaceId) throw new Error("No workspace");
      const response = await pagesService.list(workspaceId);
      return response.pages;
    },
    enabled: !!workspaceId,
  });
}

export function usePage(pageId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: pageKeys.detail(workspaceId ?? "", pageId ?? ""),
    queryFn: async () => {
      if (!workspaceId || !pageId) throw new Error("Missing params");
      const response = await pagesService.get(workspaceId, pageId);
      return response.page;
    },
    enabled: !!workspaceId && !!pageId,
  });
}

export function usePageBySlug(slug: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;

  return useQuery({
    queryKey: pageKeys.bySlug(workspaceId ?? "", slug ?? ""),
    queryFn: async () => {
      if (!workspaceId || !slug) throw new Error("Missing params");
      const response = await pagesService.getBySlug(workspaceId, slug);
      return response.page;
    },
    enabled: !!workspaceId && !!slug,
  });
}

export function useCreatePage() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePageRequest) => {
      if (!workspaceId) throw new Error("No workspace");
      const response = await pagesService.create(workspaceId, data);
      return response.page;
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: pageKeys.list(workspaceId),
        });
      }
    },
  });
}

export function useUpdatePage(pageId: string | undefined) {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePageRequest) => {
      if (!workspaceId || !pageId) throw new Error("Missing params");
      const response = await pagesService.update(
        workspaceId,
        pageId,
        data,
      );
      return response.page;
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: pageKeys.list(workspaceId),
        });
        if (pageId) {
          queryClient.invalidateQueries({
            queryKey: pageKeys.detail(workspaceId, pageId),
          });
        }
      }
    },
  });
}

export function useDeletePage() {
  const { user } = useApp();
  const workspaceId = user?.workspaceId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      if (!workspaceId) throw new Error("No workspace");
      await pagesService.delete(workspaceId, pageId);
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: pageKeys.list(workspaceId),
        });
      }
    },
  });
}
