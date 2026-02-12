import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Trash2, Table2, BarChart3, ArrowLeft } from "lucide-react";
import { routes } from "@/lib/routes";
import { useViewBySlug, useDeleteView } from "@/hooks/use-views";
import { useCompositions } from "@/hooks/use-compositions";
import { useApp } from "@/providers";
import { compositionsService } from "@/services/compositions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ViewType } from "@folio/contract/enums";
import { ViewRenderer } from "../components/view-renderer";
import { useQuery } from "@tanstack/react-query";

export default function ViewDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const { data: view, isLoading, error } = useViewBySlug(slug);
  const { data: compositions } = useCompositions();
  const deleteView = useDeleteView();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Find the composition for this view to get its slug
  const composition = compositions?.find((c) => c.id === view?.compositionId);

  // Execute the composition to get data
  const { data: executionResult, isLoading: isExecuting } = useQuery({
    queryKey: ["view-execution", user?.workspaceSlug, composition?.slug],
    queryFn: async () => {
      if (!user?.workspaceSlug || !composition?.slug) {
        throw new Error("Missing params");
      }
      return compositionsService.execute(user.workspaceSlug, composition.slug);
    },
    enabled: !!user?.workspaceSlug && !!composition?.slug,
  });

  const handleDelete = async () => {
    if (!view) return;
    try {
      await deleteView.mutateAsync(view.id);
      navigate(routes.views());
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Failed to load view</p>
        {error && <p className="text-sm">{error.message}</p>}
      </div>
    );
  }

  const ViewTypeIcon = view.viewType === ViewType.Table ? Table2 : BarChart3;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(routes.views())}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <ViewTypeIcon className="w-5 h-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-bold">{view.name}</h2>
          <p className="text-xs text-muted-foreground font-mono">
            {view.slug}
            {composition && (
              <span className="ml-2">&middot; Source: {composition.name}</span>
            )}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {view.description && (
        <p className="text-sm text-muted-foreground mb-4">{view.description}</p>
      )}

      {/* View Content */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <ViewRenderer
          viewType={view.viewType}
          config={view.config}
          data={executionResult?.data ?? []}
          isLoading={isExecuting}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete View</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{view.name}"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteView.isPending}
            >
              {deleteView.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1.5" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
