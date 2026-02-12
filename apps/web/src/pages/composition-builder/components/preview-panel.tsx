import { Copy, ExternalLink, X, CheckCircle, AlertCircle } from "lucide-react";
import JsonView from "@microlink/react-json-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompositionConfigRequest } from "@folio/contract/composition";
import type { AccessLevel } from "@folio/contract/enums";

interface PreviewResult {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: { message: string; field?: string };
}

interface PreviewPanelProps {
  config: CompositionConfigRequest;
  endpointUrl: string;
  accessLevel: AccessLevel;
  previewResult: PreviewResult | null;
  clearPreview: () => void;
}

export function PreviewPanel({
  config,
  endpointUrl,
  accessLevel,
  previewResult,
  clearPreview,
}: PreviewPanelProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Build a simple SQL-like preview
  const sqlPreview = buildSqlPreview(config);

  // Build curl example
  const curlExample = `curl "${window.location.origin}${endpointUrl}"`;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Test Results Card */}
      {previewResult && (
        <Card
          className={
            previewResult.success
              ? "border-green-500/50 bg-green-500/5"
              : "border-red-500/50 bg-red-500/5"
          }
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {previewResult.success ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Test Passed</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Test Failed</span>
                  </>
                )}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={clearPreview}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {previewResult.success ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Returned {previewResult.data?.length ?? 0} rows
                </p>
                {previewResult.data && previewResult.data.length > 0 && (
                  <div className="rounded-md bg-background p-2">
                    <JsonView
                      src={previewResult.data.slice(0, 20)}
                      theme="rjv-default"
                      collapsed={2}
                      displayDataTypes={false}
                      enableClipboard={false}
                      style={{ fontSize: "12px" }}
                    />
                    {previewResult.data.length > 20 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Showing first 20 of {previewResult.data.length} rows
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-red-600">
                <p className="font-medium">Error:</p>
                <p>{previewResult.error?.message}</p>
                {previewResult.error?.field && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Field: {previewResult.error.field}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Endpoint Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            API Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                accessLevel === "public"
                  ? "default"
                  : accessLevel === "internal"
                    ? "secondary"
                    : "outline"
              }
            >
              {accessLevel.toUpperCase()}
            </Badge>
            <Badge variant="outline">GET</Badge>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
              {endpointUrl}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => copyToClipboard(endpointUrl)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          {config.filters?.some((f) => f.param) && (
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">URL Parameters:</p>
              <ul className="list-disc list-inside">
                {config.filters
                  .filter((f) => f.param)
                  .map((f, i) => (
                    <li key={i}>
                      <code>{f.param}</code> - Filter by {f.field}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Config Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Configuration JSON
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(JSON.stringify(config, null, 2))}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted rounded-md">
            <JsonView
              src={config}
              theme="rjv-default"
              collapsed={false}
              displayDataTypes={false}
              enableClipboard={false}
              style={{ fontSize: "12px" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* SQL Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Query Preview (SQL-like)
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(sqlPreview)}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap">
            {sqlPreview}
          </pre>
        </CardContent>
      </Card>

      {/* cURL Example */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">cURL Example</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(curlExample)}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
            {curlExample}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function buildSqlPreview(config: CompositionConfigRequest): string {
  const lines: string[] = [];

  // SELECT
  if (config.aggregations?.length) {
    const selectParts: string[] = [];

    if (config.groupBy?.length) {
      selectParts.push(...config.groupBy);
    }

    config.aggregations.forEach((agg) => {
      selectParts.push(
        `${agg.function.toUpperCase()}(${agg.field}) AS ${agg.alias}`,
      );
    });

    lines.push(`SELECT ${selectParts.join(", ")}`);
  } else if (config.select?.length) {
    lines.push(`SELECT ${config.select.join(", ")}`);
  } else {
    lines.push("SELECT *");
  }

  // FROM
  lines.push(`FROM ${config.from}`);

  // WHERE
  if (config.filters?.length) {
    const whereClauses = config.filters.map((f) => {
      const value = f.param ? `:${f.param}` : `'${f.value}'`;
      return `${f.field} ${operatorToSql(f.operator)} ${value}`;
    });
    lines.push(`WHERE ${whereClauses.join(" AND ")}`);
  }

  // GROUP BY
  if (config.groupBy?.length) {
    lines.push(`GROUP BY ${config.groupBy.join(", ")}`);
  }

  // ORDER BY
  if (config.sort?.length) {
    const orderParts = config.sort.map(
      (s) => `${s.field} ${s.direction.toUpperCase()}`,
    );
    lines.push(`ORDER BY ${orderParts.join(", ")}`);
  }

  // LIMIT
  if (config.limit) {
    lines.push(`LIMIT ${config.limit}`);
  }

  return lines.join("\n");
}

function operatorToSql(op: string): string {
  const map: Record<string, string> = {
    eq: "=",
    neq: "!=",
    gt: ">",
    gte: ">=",
    lt: "<",
    lte: "<=",
    contains: "ILIKE",
    in: "IN",
  };
  return map[op] ?? "=";
}
