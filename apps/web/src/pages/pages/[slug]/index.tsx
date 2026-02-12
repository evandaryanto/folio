import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Trash2,
  ArrowLeft,
  Plus,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  Type,
  Save,
  Maximize2,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { usePageBySlug, useUpdatePage, useDeletePage } from "@/hooks/use-pages";
import { useViews } from "@/hooks/use-views";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BlockType } from "@folio/contract/enums";
import type { PageBlock } from "@folio/contract/page";
import type { ViewResponse } from "@folio/contract/view";
import { PageBlockRenderer } from "../components/page-block-renderer";

export default function PageDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading, error } = usePageBySlug(slug);
  const { data: views } = useViews();
  const updatePage = useUpdatePage(page?.id);
  const deletePage = useDeletePage();

  const [blocks, setBlocks] = useState<PageBlock[] | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddViewDialog, setShowAddViewDialog] = useState(false);
  const [showAddTextDialog, setShowAddTextDialog] = useState(false);
  const [newTextContent, setNewTextContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Use local blocks state if modified, otherwise use page data
  const currentBlocks = blocks ?? page?.blocks ?? [];

  const updateBlocks = (newBlocks: PageBlock[]) => {
    setBlocks(newBlocks);
    setHasChanges(true);
  };

  const addViewBlock = (view: ViewResponse) => {
    const newBlock: PageBlock = {
      type: BlockType.View,
      viewId: view.id,
      title: view.name,
    };
    updateBlocks([...currentBlocks, newBlock]);
    setShowAddViewDialog(false);
  };

  const addTextBlock = () => {
    if (!newTextContent.trim()) return;
    const newBlock: PageBlock = {
      type: BlockType.Text,
      content: newTextContent.trim(),
      format: "markdown",
    };
    updateBlocks([...currentBlocks, newBlock]);
    setNewTextContent("");
    setShowAddTextDialog(false);
  };

  const removeBlock = (index: number) => {
    updateBlocks(currentBlocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentBlocks.length) return;
    const newBlocks = [...currentBlocks];
    [newBlocks[index], newBlocks[newIndex]] = [
      newBlocks[newIndex],
      newBlocks[index],
    ];
    updateBlocks(newBlocks);
  };

  const handleSave = async () => {
    if (!page) return;
    try {
      await updatePage.mutateAsync({ blocks: currentBlocks });
      setHasChanges(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!page) return;
    try {
      await deletePage.mutateAsync(page.id);
      navigate(routes.pages());
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

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Failed to load page</p>
        {error && <p className="text-sm">{error.message}</p>}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(routes.pages())}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-lg font-bold">{page.name}</h2>
          <p className="text-xs text-muted-foreground font-mono">{page.slug}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(routes.pagePresent(page.slug))}
          >
            <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
            Present
          </Button>
          {hasChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updatePage.isPending}
            >
              {updatePage.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              Save
            </Button>
          )}
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

      {page.description && (
        <p className="text-sm text-muted-foreground mb-4">{page.description}</p>
      )}

      {/* Block Editor */}
      <div className="space-y-4">
        {currentBlocks.length === 0 && (
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p className="mb-2">No blocks yet</p>
            <p className="text-sm">Add view or text blocks to build your page</p>
          </div>
        )}

        {currentBlocks.map((block, index) => (
          <div
            key={index}
            className="border border-border rounded-lg bg-card overflow-hidden"
          >
            {/* Block toolbar */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-secondary/50 border-b border-border">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                {block.type === BlockType.View ? (
                  <>
                    <Eye className="w-3 h-3" />
                    View
                  </>
                ) : (
                  <>
                    <Type className="w-3 h-3" />
                    Text
                  </>
                )}
              </span>
              <div className="ml-auto flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled={index === 0}
                  onClick={() => moveBlock(index, "up")}
                >
                  <ArrowUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled={index === currentBlocks.length - 1}
                  onClick={() => moveBlock(index, "down")}
                >
                  <ArrowDown className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeBlock(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {/* Block content */}
            <div className="p-4">
              <PageBlockRenderer block={block} />
            </div>
          </div>
        ))}

        {/* Add block buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddViewDialog(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <Eye className="w-3.5 h-3.5 mr-1" />
            Add View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddTextDialog(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <Type className="w-3.5 h-3.5 mr-1" />
            Add Text
          </Button>
        </div>
      </div>

      {/* Add View Dialog */}
      <Dialog open={showAddViewDialog} onOpenChange={setShowAddViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add View Block</DialogTitle>
            <DialogDescription>
              Select a view to embed in this page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {!views || views.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No views available. Create a view first.
              </p>
            ) : (
              views.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => addViewBlock(view)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <div className="font-medium text-sm">{view.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {view.slug} &middot; {view.viewType}
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Text Dialog */}
      <Dialog open={showAddTextDialog} onOpenChange={setShowAddTextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text Block</DialogTitle>
            <DialogDescription>
              Add text content. Supports basic markdown (headers, lists).
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="text-content" className="text-xs font-semibold">
              Content
            </Label>
            <Textarea
              id="text-content"
              value={newTextContent}
              onChange={(e) => setNewTextContent(e.target.value)}
              placeholder="Write your content here...&#10;&#10;# Heading&#10;## Subheading&#10;- List item"
              rows={8}
              className="mt-1 font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewTextContent("");
                setShowAddTextDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addTextBlock}
              disabled={!newTextContent.trim()}
            >
              Add Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{page.name}"? This action cannot
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
              disabled={deletePage.isPending}
            >
              {deletePage.isPending ? (
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
