import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Key,
  Plus,
  Copy,
  Play,
  Globe,
  Lock,
  Users,
  Loader2,
  Zap,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { useCompositions } from "@/hooks/use-compositions";
import { useApp } from "@/providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AccessLevel } from "@folio/contract/enums";
import { compositionsService } from "@/services/compositions";
import type { CompositionResponse } from "@folio/contract/composition";

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-green-500/10 text-green-600",
    POST: "bg-blue-500/10 text-blue-600",
    PUT: "bg-yellow-500/10 text-yellow-600",
    DELETE: "bg-red-500/10 text-red-600",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-1.5 py-0.5 rounded min-w-[44px] text-center inline-block",
        colors[method] ?? "bg-secondary text-muted-foreground",
      )}
    >
      {method}
    </span>
  );
}

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-border text-muted-foreground text-[11px] hover:border-muted-foreground hover:text-foreground transition-all"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function TestButton({
  composition,
  workspaceSlug,
}: {
  composition: CompositionResponse;
  workspaceSlug: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  const handleTest = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!workspaceSlug) return;

    setLoading(true);
    setResult(null);
    try {
      await compositionsService.execute(workspaceSlug, composition.slug);
      setResult("success");
    } catch {
      setResult("error");
    } finally {
      setLoading(false);
      setTimeout(() => setResult(null), 2000);
    }
  };

  return (
    <button
      onClick={handleTest}
      disabled={loading}
      className={cn(
        "p-1 rounded border transition-all",
        result === "success"
          ? "border-green-500 text-green-500"
          : result === "error"
            ? "border-red-500 text-red-500"
            : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground",
      )}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : result === "success" ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Play className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export default function ApisPage() {
  const { user } = useApp();
  const { data: compositions, isPending, error } = useCompositions();

  const workspaceSlug = user?.workspaceSlug ?? "";
  const baseUrl = `/api/v1/c/${workspaceSlug}/`;

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Failed to load APIs</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  const hasApis = compositions && compositions.length > 0;

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold">APIs</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {compositions?.length ?? 0} endpoints
        </span>
        <div className="ml-auto flex gap-2">
          <Link to={routes.apiKeys()}>
            <Button variant="outline" size="sm">
              <Key className="w-3.5 h-3.5 mr-1.5" />
              API Keys
            </Button>
          </Link>
          <Link to={routes.collections()}>
            <Button size="sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New API
            </Button>
          </Link>
        </div>
      </div>

      {/* Base URL */}
      <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-md bg-card border border-border font-mono text-xs">
        <span className="text-muted-foreground">{baseUrl}</span>
        <span className="text-primary">{"<slug>"}</span>
        <div className="ml-auto">
          <CopyButton text={`${window.location.origin}${baseUrl}`} />
        </div>
      </div>

      {!hasApis ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No APIs yet</p>
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
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[70px]">
                  Method
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Endpoint
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Name
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Collection
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Access
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[60px]">
                  Test
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {compositions.map((composition) => (
                <tr
                  key={composition.id}
                  className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <MethodBadge method="GET" />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    /c/{composition.slug}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      to={routes.compositionDetail(composition.slug)}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {composition.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {composition.config.from}
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
                  <td className="px-4 py-2.5 text-center">
                    <TestButton
                      composition={composition}
                      workspaceSlug={workspaceSlug}
                    />
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
