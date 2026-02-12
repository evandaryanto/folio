import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Table2,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  AreaChart as AreaChartIcon,
  Loader2,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { useCreateView } from "@/hooks/use-views";
import { useCompositions } from "@/hooks/use-compositions";
import { useApp } from "@/providers";
import { compositionsService } from "@/services/compositions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ViewType, ChartType } from "@folio/contract/enums";
import { cn } from "@/lib/utils";
import { useCreateView as useCreateViewForm } from "./use-create-view";
import type { CreateViewStep } from "./use-create-view";
import { useQuery } from "@tanstack/react-query";

const STEP_LABELS: Record<CreateViewStep, string> = {
  type: "View Type",
  composition: "Data Source",
  configure: "Configure",
  save: "Name & Save",
};

export default function CreateViewPage() {
  const navigate = useNavigate();
  const { user } = useApp();
  const createViewMutation = useCreateView();
  const { data: compositions, isLoading: compositionsLoading } =
    useCompositions();

  const form = useCreateViewForm();

  // Find selected composition for preview
  const selectedComposition = compositions?.find(
    (c) => c.id === form.compositionId,
  );

  // Preview composition data to discover available fields
  const { data: previewData } = useQuery({
    queryKey: ["view-preview", user?.workspaceSlug, selectedComposition?.slug],
    queryFn: async () => {
      if (!user?.workspaceSlug || !selectedComposition?.slug) {
        throw new Error("Missing params");
      }
      return compositionsService.execute(
        user.workspaceSlug,
        selectedComposition.slug,
      );
    },
    enabled: !!user?.workspaceSlug && !!selectedComposition?.slug,
  });

  // Available fields from the composition result
  const availableFields =
    previewData?.data && previewData.data.length > 0
      ? Object.keys(previewData.data[0])
      : [];

  const handleSubmit = async () => {
    const request = form.buildRequest();
    if (!request) return;
    try {
      const view = await createViewMutation.mutateAsync(request);
      navigate(routes.viewDetail(view.slug));
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(routes.views())}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-bold">Create View</h2>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {form.steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-8",
                  i <= form.currentStepIndex ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                i === form.currentStepIndex
                  ? "bg-primary text-primary-foreground"
                  : i < form.currentStepIndex
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              {i < form.currentStepIndex ? (
                <Check className="w-3 h-3" />
              ) : (
                <span>{i + 1}</span>
              )}
              <span>{STEP_LABELS[step]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="max-w-2xl">
        {/* Step 1: Choose View Type */}
        {form.currentStep === "type" && (
          <div>
            <h3 className="text-sm font-semibold mb-4">Choose a view type</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => form.setViewType(ViewType.Table)}
                className={cn(
                  "p-6 rounded-lg border-2 text-left transition-all hover:border-primary/50",
                  form.viewType === ViewType.Table
                    ? "border-primary bg-primary/5"
                    : "border-border",
                )}
              >
                <Table2 className="w-8 h-8 mb-3 text-primary" />
                <div className="font-medium mb-1">Table</div>
                <p className="text-xs text-muted-foreground">
                  Display data in a structured table with columns, sorting, and
                  pagination
                </p>
              </button>

              <button
                type="button"
                onClick={() => form.setViewType(ViewType.Chart)}
                className={cn(
                  "p-6 rounded-lg border-2 text-left transition-all hover:border-primary/50",
                  form.viewType === ViewType.Chart
                    ? "border-primary bg-primary/5"
                    : "border-border",
                )}
              >
                <BarChart3 className="w-8 h-8 mb-3 text-primary" />
                <div className="font-medium mb-1">Chart</div>
                <p className="text-xs text-muted-foreground">
                  Visualize data with bar, line, area, or pie charts
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Composition */}
        {form.currentStep === "composition" && (
          <div>
            <h3 className="text-sm font-semibold mb-4">
              Select a data source (composition)
            </h3>
            {compositionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : !compositions || compositions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No compositions found.</p>
                  <p className="text-sm mt-1">
                    Create a composition first to use as a data source.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {compositions
                  .filter((c) => c.isActive)
                  .map((comp) => (
                    <button
                      type="button"
                      key={comp.id}
                      onClick={() => form.setCompositionId(comp.id)}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50",
                        form.compositionId === comp.id
                          ? "border-primary bg-primary/5"
                          : "border-border",
                      )}
                    >
                      <div className="font-medium">{comp.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {comp.slug}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded bg-secondary text-[11px] font-mono">
                          from: {comp.config.from}
                        </span>
                        {comp.config.groupBy &&
                          comp.config.groupBy.length > 0 && (
                            <span className="px-2 py-0.5 rounded bg-secondary text-[11px] font-mono">
                              groupBy: {comp.config.groupBy.join(", ")}
                            </span>
                          )}
                        {comp.config.aggregations &&
                          comp.config.aggregations.length > 0 && (
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-mono">
                              {comp.config.aggregations.length} aggregation(s)
                            </span>
                          )}
                      </div>
                      {comp.description && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {comp.description}
                        </p>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Configure View */}
        {form.currentStep === "configure" && (
          <div>
            <h3 className="text-sm font-semibold mb-4">
              Configure your {form.viewType} view
            </h3>

            {availableFields.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading available fields...</p>
                </CardContent>
              </Card>
            ) : form.viewType === ViewType.Table ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold mb-2 block">
                    Select columns to display
                  </Label>
                  <div className="space-y-2">
                    {availableFields.map((field) => {
                      const isSelected = form.tableColumns.some(
                        (c) => c.field === field,
                      );
                      return (
                        <label
                          key={field}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30",
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              form.toggleTableColumn(field)
                            }
                          />
                          <span className="font-mono text-sm">{field}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label htmlFor="pageSize" className="text-xs font-semibold">
                    Page size
                  </Label>
                  <Input
                    id="pageSize"
                    type="number"
                    min={1}
                    max={100}
                    value={form.tablePageSize}
                    onChange={(e) =>
                      form.setTablePageSize(Number(e.target.value) || 20)
                    }
                    className="mt-1 w-32"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Chart Type */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">
                    Chart type
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {
                        type: ChartType.Bar,
                        icon: BarChart3,
                        label: "Bar",
                      },
                      {
                        type: ChartType.Line,
                        icon: LineChartIcon,
                        label: "Line",
                      },
                      {
                        type: ChartType.Area,
                        icon: AreaChartIcon,
                        label: "Area",
                      },
                      {
                        type: ChartType.Pie,
                        icon: PieChartIcon,
                        label: "Pie",
                      },
                    ].map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => form.setChartType(type)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                          form.chartType === type
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* X Axis */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">
                    X Axis (category field)
                  </Label>
                  <div className="space-y-1.5">
                    {availableFields.map((field) => (
                      <button
                        key={field}
                        type="button"
                        onClick={() => form.setXAxis(field)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg border transition-colors font-mono text-sm",
                          form.xAxis === field
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30",
                        )}
                      >
                        {field}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Y Axis */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">
                    Y Axis (value fields)
                  </Label>
                  <div className="space-y-1.5">
                    {availableFields
                      .filter((f) => f !== form.xAxis)
                      .map((field) => {
                        const isSelected = form.yAxis.includes(field);
                        return (
                          <label
                            key={field}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30",
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => form.toggleYAxis(field)}
                            />
                            <span className="font-mono text-sm">{field}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Name & Save */}
        {form.currentStep === "save" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold mb-4">Name your view</h3>
            <div>
              <Label htmlFor="name" className="text-xs font-semibold">
                Name
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => form.handleNameChange(e.target.value)}
                placeholder="e.g. Revenue by Category"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="slug" className="text-xs font-semibold">
                Slug
              </Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => form.setSlug(e.target.value)}
                placeholder="e.g. revenue-by-category"
                className="mt-1 font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                URL-friendly identifier. Auto-generated from name.
              </p>
            </div>
            <div>
              <Label htmlFor="description" className="text-xs font-semibold">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => form.setDescription(e.target.value)}
                placeholder="Describe what this view shows..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 mt-8 max-w-2xl">
        {form.currentStepIndex > 0 && (
          <Button variant="outline" onClick={form.goBack}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
        )}
        <div className="ml-auto">
          {form.currentStep === "save" ? (
            <Button
              onClick={handleSubmit}
              disabled={!form.canGoNext || createViewMutation.isPending}
            >
              {createViewMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Check className="w-4 h-4 mr-1.5" />
              )}
              Create View
            </Button>
          ) : (
            <Button onClick={form.goNext} disabled={!form.canGoNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
