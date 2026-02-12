import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronRight, Loader2 } from "lucide-react";
import { useCollections, useCreateCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateCollectionModal } from "./components/create-collection-modal";

export default function CollectionsPage() {
  const { data: collections, isLoading, error } = useCollections();
  const createCollection = useCreateCollection();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Failed to load collections</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold">Collections</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {collections?.length ?? 0} total
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Collection
          </Button>
        </div>
      </div>

      {collections?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No collections yet</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {collections?.map((c) => (
            <Link
              key={c.id}
              to={`/collections/${c.slug}`}
              className="bg-card border border-border rounded-lg p-4 hover:border-muted-foreground transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{c.icon || "📁"}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.name}</h3>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-muted-foreground">
                      <span className="font-mono text-foreground">
                        {c.slug}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      v{c.version}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateCollectionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreate={async (data) => {
          await createCollection.mutateAsync(data);
          setShowCreateModal(false);
        }}
        isLoading={createCollection.isPending}
      />
    </>
  );
}
