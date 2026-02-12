import { Link } from "react-router-dom";
import {
  Plus,
  ChevronRight,
  Globe,
  Lock,
  Users,
  Loader2,
  Layers,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { useCompositions } from "@/hooks/use-compositions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AccessLevel } from "@folio/contract/enums";
import type { CompositionResponse } from "@folio/contract/composition";

function AccessBadge({ access }: { access: AccessLevel }) {
  const Icon =
    access === AccessLevel.Public
      ? Globe
      : access === AccessLevel.Internal
        ? Users
        : Lock;
  const label =
    access === AccessLevel.Public
      ? "public"
      : access === AccessLevel.Internal
        ? "internal"
        : "private";

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[11px]">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function formatAggregations(composition: CompositionResponse): string[] {
  const aggs = composition.config.aggregations;
  if (!aggs || aggs.length === 0) return [];

  return aggs.map((agg) => `${agg.function}(${agg.field})`);
}

export default function CompositionsPage() {
  const { data: compositions, isLoading, error } = useCompositions();

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
        <p>Failed to load compositions</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  const hasCompositions = compositions && compositions.length > 0;

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold">Compositions</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {compositions?.length ?? 0} compositions
        </span>
        <div className="ml-auto">
          <Link to={routes.collections()}>
            <Button size="sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Composition
            </Button>
          </Link>
        </div>
      </div>

      {!hasCompositions ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No compositions yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a composition from a collection to expose it via API
            </p>
            <Link to={routes.collections()}>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Go to Collections
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Name
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Source
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Aggregations
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Access
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {compositions.map((composition) => {
                const aggregations = formatAggregations(composition);

                return (
                  <tr
                    key={composition.id}
                    className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        to={routes.compositionDetail(composition.slug)}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {composition.name}
                      </Link>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {composition.slug}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[11px] font-mono">
                        {composition.config.from}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        {aggregations.length > 0 ? (
                          aggregations.map((agg, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-mono"
                            >
                              {agg}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <AccessBadge access={composition.accessLevel} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                          composition.isActive
                            ? "bg-green-500/10 text-green-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {composition.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        to={routes.compositionDetail(composition.slug)}
                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors inline-flex"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
