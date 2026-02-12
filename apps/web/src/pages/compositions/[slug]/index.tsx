import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import {
  Play,
  Edit,
  Copy,
  Globe,
  Lock,
  Users,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import JsonView from "@microlink/react-json-view";
import { useCompositionBySlug } from "@/hooks/use-compositions";
import { useApp } from "@/providers";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessLevel } from "@folio/contract/enums";
import { compositionsService } from "@/services/compositions";

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
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="w-3 h-3 mr-1.5" />
      ) : (
        <Copy className="w-3 h-3 mr-1.5" />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export default function CompositionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useApp();
  const { data: composition, isLoading, error } = useCompositionBySlug(slug);

  const [testResult, setTestResult] = useState<{
    data: Record<string, unknown>[] | null;
    error: string | null;
    loading: boolean;
  }>({ data: null, error: null, loading: false });

  const workspaceSlug = user?.workspaceSlug ?? "";
  const endpointUrl = `/api/v1/c/${workspaceSlug}/${slug}`;

  const handleTest = async () => {
    if (!workspaceSlug || !slug) return;

    setTestResult({ data: null, error: null, loading: true });
    try {
      const result = await compositionsService.execute(workspaceSlug, slug);
      setTestResult({ data: result.data, error: null, loading: false });
    } catch (e) {
      setTestResult({
        data: null,
        error: e instanceof Error ? e.message : "Execution failed",
        loading: false,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !composition) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p>Failed to load composition</p>
        {error && <p className="text-sm">{error.message}</p>}
      </div>
    );
  }

  const configJson = JSON.stringify(composition.config, null, 2);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold">{composition.name}</h2>
        <AccessBadge access={composition.accessLevel} />
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
            composition.isActive
              ? "bg-green-500/10 text-green-600"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {composition.isActive ? "Active" : "Inactive"}
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testResult.loading}
          >
            {testResult.loading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 mr-1.5" />
            )}
            Test
          </Button>
          <Link
            to={routes.compositionEditor(
              composition.config.from,
              composition.slug,
            )}
          >
            <Button variant="outline" size="sm">
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Description */}
      {composition.description && (
        <p className="text-sm text-muted-foreground mb-5">
          {composition.description}
        </p>
      )}

      {/* Endpoint URL */}
      <div className="flex items-center gap-2 px-4 py-2.5 mb-5 rounded-md bg-card border border-border font-mono text-xs">
        <span className="text-muted-foreground">GET</span>
        <span className="text-primary ml-2">{endpointUrl}</span>
        <div className="ml-auto">
          <CopyButton text={`${window.location.origin}${endpointUrl}`} />
        </div>
      </div>

      {/* URL Parameters */}
      {composition.config.filters?.some((f) => f.param) && (
        <Card className="mb-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">URL Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {composition.config.filters
                .filter((f) => f.param)
                .map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <code className="px-2 py-0.5 rounded bg-secondary text-primary font-mono">
                      {f.param}
                    </code>
                    <span className="text-muted-foreground">
                      Filter by {f.field} ({f.operator})
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two column grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Configuration */}
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">Configuration</CardTitle>
            <CopyButton text={configJson} />
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted rounded-md">
              <JsonView
                src={composition.config}
                theme="rjv-default"
                collapsed={false}
                displayDataTypes={false}
                enableClipboard={false}
                style={{ fontSize: "12px" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Result */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : testResult.error ? (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {testResult.error}
              </div>
            ) : testResult.data ? (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  {testResult.data.length} rows returned
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <JsonView
                    src={testResult.data}
                    theme="rjv-default"
                    collapsed={2}
                    displayDataTypes={false}
                    enableClipboard={false}
                    style={{ fontSize: "12px" }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Play className="w-8 h-8 mb-2" />
                <p className="text-sm">Click "Test" to execute the API</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Source Collection</dt>
            <dd className="font-mono">{composition.config.from}</dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(composition.createdAt).toLocaleString()}</dd>
            <dt className="text-muted-foreground">Last Updated</dt>
            <dd>{new Date(composition.updatedAt).toLocaleString()}</dd>
            <dt className="text-muted-foreground">ID</dt>
            <dd className="font-mono text-xs">{composition.id}</dd>
          </dl>
        </CardContent>
      </Card>
    </>
  );
}
