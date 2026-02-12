import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { routes } from "@/lib/routes";
import { useApp } from "@/providers";
import { pagesService } from "@/services/pages";
import { Button } from "@/components/ui/button";
import { PageBlockRenderer } from "../components/page-block-renderer";

export default function PagePresentPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useApp();

  // Use public API endpoint — no auth required
  const {
    data: page,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["page-public", user?.workspaceSlug, slug],
    queryFn: async () => {
      if (!user?.workspaceSlug || !slug) throw new Error("Missing params");
      const response = await pagesService.getPublic(
        user.workspaceSlug,
        slug,
      );
      return response.page;
    },
    enabled: !!user?.workspaceSlug && !!slug,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center text-muted-foreground">
        <p>Failed to load page</p>
        {error && <p className="text-sm mt-1">{error.message}</p>}
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate(routes.pages())}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(routes.pageDetail(page.slug))}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Editor
          </Button>
          <h1 className="text-sm font-semibold">{page.name}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {page.blocks.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <p>This page has no content yet.</p>
            <p className="text-sm mt-1">
              Go back to the editor to add blocks.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {page.blocks.map((block, index) => (
              <div key={index}>
                <PageBlockRenderer block={block} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
