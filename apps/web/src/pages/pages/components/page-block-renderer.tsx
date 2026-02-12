import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BlockType } from "@folio/contract/enums";
import type { PageBlock, ViewBlock, TextBlock } from "@folio/contract/page";
import { useView } from "@/hooks/use-views";
import { useCompositions } from "@/hooks/use-compositions";
import { useApp } from "@/providers";
import { compositionsService } from "@/services/compositions";
import { ViewRenderer } from "@/pages/views/components/view-renderer";

function ViewBlockRenderer({ block }: { block: ViewBlock }) {
  const { user } = useApp();
  const { data: view, isLoading: viewLoading } = useView(block.viewId);
  const { data: compositions } = useCompositions();

  const composition = compositions?.find((c) => c.id === view?.compositionId);

  const { data: executionResult, isLoading: isExecuting } = useQuery({
    queryKey: ["page-block-execution", user?.workspaceSlug, composition?.slug],
    queryFn: async () => {
      if (!user?.workspaceSlug || !composition?.slug) {
        throw new Error("Missing params");
      }
      return compositionsService.execute(user.workspaceSlug, composition.slug);
    },
    enabled: !!user?.workspaceSlug && !!composition?.slug,
  });

  if (viewLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!view) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        View not found (ID: {block.viewId})
      </div>
    );
  }

  return (
    <div>
      {block.title && (
        <h3 className="text-sm font-semibold mb-3">{block.title}</h3>
      )}
      <ViewRenderer
        viewType={view.viewType}
        config={view.config}
        data={executionResult?.data ?? []}
        isLoading={isExecuting}
      />
    </div>
  );
}

function TextBlockRenderer({ block }: { block: TextBlock }) {
  if (block.format === "plain") {
    return <p className="text-sm whitespace-pre-wrap">{block.content}</p>;
  }

  // Simple markdown-like rendering (basic support)
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {block.content.split("\n").map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-base font-semibold mt-4 mb-2">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-lg font-semibold mt-4 mb-2">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-xl font-bold mt-4 mb-2">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <li key={i} className="text-sm ml-4">
              {line.slice(2)}
            </li>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-2" />;
        }
        return (
          <p key={i} className="text-sm">
            {line}
          </p>
        );
      })}
    </div>
  );
}

interface PageBlockRendererProps {
  block: PageBlock;
}

export function PageBlockRenderer({ block }: PageBlockRendererProps) {
  if (block.type === BlockType.View) {
    return <ViewBlockRenderer block={block as ViewBlock} />;
  }

  if (block.type === BlockType.Text) {
    return <TextBlockRenderer block={block as TextBlock} />;
  }

  return (
    <div className="text-muted-foreground text-center py-4">
      Unsupported block type
    </div>
  );
}
