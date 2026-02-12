import { Link } from "react-router-dom";
import {
  Plus,
  ChevronRight,
  Loader2,
  LayoutDashboard,
  Table2,
  BarChart3,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { useViews } from "@/hooks/use-views";
import { useCompositions } from "@/hooks/use-compositions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ViewType } from "@folio/contract/enums";
import type { ViewResponse } from "@folio/contract/view";

function ViewTypeBadge({ viewType }: { viewType: ViewType }) {
  const Icon = viewType === ViewType.Table ? Table2 : BarChart3;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[11px]">
      <Icon className="w-3 h-3" />
      {viewType}
    </span>
  );
}

export default function ViewsPage() {
  const { data: views, isLoading, error } = useViews();
  const { data: compositions } = useCompositions();

  const getCompositionName = (compositionId: string) => {
    const comp = compositions?.find((c) => c.id === compositionId);
    return comp?.name ?? "Unknown";
  };

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
        <p>Failed to load views</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  const hasViews = views && views.length > 0;

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold">Views</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {views?.length ?? 0} views
        </span>
        <div className="ml-auto">
          <Link to={routes.viewCreate()}>
            <Button size="sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New View
            </Button>
          </Link>
        </div>
      </div>

      {!hasViews ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No views yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a view to visualize your composition data as tables or
              charts
            </p>
            <Link to={routes.viewCreate()}>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create View
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {views.map((view: ViewResponse) => (
            <Link
              key={view.id}
              to={routes.viewDetail(view.slug)}
              className="group"
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                        {view.name}
                      </h3>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {view.slug}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <ViewTypeBadge viewType={view.viewType} />
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${
                        view.isActive
                          ? "bg-green-500/10 text-green-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {view.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Source:{" "}
                    <span className="font-mono">
                      {getCompositionName(view.compositionId)}
                    </span>
                  </div>

                  {view.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {view.description}
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
