import { Database, Zap, Plus, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn, formatNumber } from "@/lib/utils";
import { useCollections } from "@/hooks/use-collections";
import { useCompositions } from "@/hooks/use-compositions";
import { AccessLevel } from "@folio/contract/enums";
import { useApp } from "@/providers";

function StatCard({
  label,
  value,
  sub,
  color,
  isLoading,
}: {
  label: string;
  value: number;
  sub: string;
  color?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5">
        {label}
      </div>
      {isLoading ? (
        <div className="h-8 flex items-center">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className={cn("text-2xl font-bold font-mono", color)}>
          {formatNumber(value)}
        </div>
      )}
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function CollectionIcon({ icon }: { icon: string | null }) {
  const icons: Record<string, string> = {
    money: "💰",
    file: "📄",
    user: "👤",
    box: "📦",
    folder: "📁",
    database: "🗃️",
    chart: "📊",
    star: "⭐",
    heart: "❤️",
    tag: "🏷️",
  };
  return <span className="text-lg">{icons[icon ?? ""] || "📋"}</span>;
}

function AccessBadge({ access }: { access: AccessLevel }) {
  const colors: Record<string, string> = {
    public: "bg-success/10 text-success",
    internal: "bg-info/10 text-info",
    private: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-medium px-1.5 py-0.5 rounded",
        colors[access],
      )}
    >
      {access}
    </span>
  );
}

export default function OverviewPage() {
  const { user } = useApp();
  const { data: collections, isPending: collectionsLoading } = useCollections();
  const { data: compositions, isPending: compositionsLoading } =
    useCompositions();

  const isLoading = collectionsLoading || compositionsLoading;

  // Calculate stats from real data
  const collectionCount = collections?.length ?? 0;
  const compositionCount = compositions?.length ?? 0;
  const activeCompositions =
    compositions?.filter((c) => c.isActive).length ?? 0;
  const publicCompositions =
    compositions?.filter((c) => c.accessLevel === AccessLevel.Public).length ??
    0;

  const stats = [
    {
      label: "Collections",
      value: collectionCount,
      sub: `${collectionCount === 1 ? "1 collection" : `${collectionCount} collections`} total`,
    },
    {
      label: "Compositions",
      value: compositionCount,
      sub: `${activeCompositions} active`,
    },
    {
      label: "Public APIs",
      value: publicCompositions,
      sub: "Publicly accessible",
      color: publicCompositions > 0 ? "text-success" : undefined,
    },
    {
      label: "Active",
      value: activeCompositions,
      sub: `of ${compositionCount} total`,
      color: activeCompositions > 0 ? "text-success" : undefined,
    },
  ];

  // Get recent collections (top 5)
  const recentCollections = collections?.slice(0, 5) ?? [];

  // Get recent compositions (top 5)
  const recentCompositions = compositions?.slice(0, 5) ?? [];

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} isLoading={isLoading} />
        ))}
      </div>

      {/* Two column grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Collections */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              Collections
            </h3>
            <Link
              to="/collections"
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-card text-muted-foreground text-[11px] font-medium hover:border-muted-foreground hover:text-foreground transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </Link>
          </div>
          {collectionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Database className="w-8 h-8 mb-2" />
              <p className="text-sm">No collections yet</p>
              <Link
                to="/collections"
                className="text-primary text-sm mt-1 hover:underline"
              >
                Create your first collection
              </Link>
            </div>
          ) : (
            recentCollections.map((c) => (
              <Link
                key={c.id}
                to={`/collections/${c.slug}`}
                className="flex items-center gap-3 px-4 py-2 border-b border-border last:border-b-0 hover:bg-secondary transition-colors cursor-pointer"
              >
                <CollectionIcon icon={c.icon} />
                <span className="font-medium flex-1 truncate">{c.name}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    c.isActive
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {c.isActive ? "active" : "inactive"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            ))
          )}
        </div>

        {/* Compositions */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              Recent APIs
            </h3>
            <Link
              to="/compositions"
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-card text-muted-foreground text-[11px] font-medium hover:border-muted-foreground hover:text-foreground transition-all"
            >
              View All
            </Link>
          </div>
          {compositionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentCompositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Zap className="w-8 h-8 mb-2" />
              <p className="text-sm">No APIs created yet</p>
              <p className="text-xs mt-1">
                Create a composition from a collection
              </p>
            </div>
          ) : (
            recentCompositions.map((c) => (
              <Link
                key={c.id}
                to={`/compositions/${c.slug}`}
                className="flex items-center gap-3 px-4 py-2 border-b border-border last:border-b-0 hover:bg-secondary transition-colors cursor-pointer"
              >
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded min-w-[44px] text-center bg-success/10 text-success">
                  GET
                </span>
                <span className="font-mono text-xs flex-1 truncate">
                  /c/{user?.workspaceSlug}/{c.slug}
                </span>
                <AccessBadge access={c.accessLevel} />
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
