import { Link } from "react-router-dom";
import { Plus, ChevronRight, Loader2, FileText, Eye, Type } from "lucide-react";
import { routes } from "@/lib/routes";
import { usePages } from "@/hooks/use-pages";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlockType } from "@folio/contract/enums";
import type { PageResponse } from "@folio/contract/page";

function BlockCountBadge({ blocks }: { blocks: PageResponse["blocks"] }) {
  const viewCount = blocks.filter((b) => b.type === BlockType.View).length;
  const textCount = blocks.filter((b) => b.type === BlockType.Text).length;

  return (
    <div className="flex items-center gap-2">
      {viewCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[11px]">
          <Eye className="w-3 h-3" />
          {viewCount} view{viewCount !== 1 ? "s" : ""}
        </span>
      )}
      {textCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[11px]">
          <Type className="w-3 h-3" />
          {textCount} text
        </span>
      )}
      {blocks.length === 0 && (
        <span className="text-[11px] text-muted-foreground">No blocks</span>
      )}
    </div>
  );
}

export default function PagesListPage() {
  const { data: pages, isLoading, error } = usePages();

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
        <p>Failed to load pages</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  const hasPages = pages && pages.length > 0;

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold">Pages</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {pages?.length ?? 0} pages
        </span>
        <div className="ml-auto">
          <Link to={routes.pageCreate()}>
            <Button size="sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Page
            </Button>
          </Link>
        </div>
      </div>

      {!hasPages ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No pages yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a page to build custom interfaces with views and text
              content
            </p>
            <Link to={routes.pageCreate()}>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Page
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page: PageResponse) => (
            <Link
              key={page.id}
              to={routes.pageDetail(page.slug)}
              className="group"
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                        {page.name}
                      </h3>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {page.slug}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <BlockCountBadge blocks={page.blocks} />
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${
                        page.isActive
                          ? "bg-green-500/10 text-green-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {page.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {page.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {page.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
