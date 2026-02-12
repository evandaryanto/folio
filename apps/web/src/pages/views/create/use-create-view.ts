import { useState, useMemo, useCallback } from "react";
import { ViewType, ChartType } from "@folio/contract/enums";
import type {
  CreateViewRequest,
  TableViewConfig,
  ChartViewConfig,
} from "@folio/contract/view";

export type CreateViewStep = "type" | "composition" | "configure" | "save";

const STEPS: CreateViewStep[] = ["type", "composition", "configure", "save"];

export function useCreateView() {
  // Step tracking
  const [currentStep, setCurrentStep] = useState<CreateViewStep>("type");

  // Form state
  const [viewType, setViewType] = useState<ViewType | null>(null);
  const [compositionId, setCompositionId] = useState<string>("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  // Table config
  const [tableColumns, setTableColumns] = useState<TableViewConfig["columns"]>(
    [],
  );
  const [tablePageSize, setTablePageSize] = useState(20);

  // Chart config
  const [chartType, setChartType] = useState<ChartType>(ChartType.Bar);
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState<string[]>([]);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case "type":
        return viewType !== null;
      case "composition":
        return compositionId !== "";
      case "configure":
        if (viewType === ViewType.Table) {
          return tableColumns.length > 0;
        }
        return xAxis !== "" && yAxis.length > 0;
      case "save":
        return name.trim() !== "" && slug.trim() !== "";
      default:
        return false;
    }
  }, [
    currentStep,
    viewType,
    compositionId,
    tableColumns,
    xAxis,
    yAxis,
    name,
    slug,
  ]);

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }, [currentStepIndex]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }, [currentStepIndex]);

  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }, []);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (!slug || slug === generateSlug(name)) {
        setSlug(generateSlug(value));
      }
    },
    [slug, name, generateSlug],
  );

  const toggleYAxis = useCallback((field: string) => {
    setYAxis((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  }, []);

  const toggleTableColumn = useCallback((field: string) => {
    setTableColumns((prev) => {
      const exists = prev.find((c) => c.field === field);
      if (exists) {
        return prev.filter((c) => c.field !== field);
      }
      return [...prev, { field }];
    });
  }, []);

  const buildRequest = useCallback((): CreateViewRequest | null => {
    if (!viewType || !compositionId || !name || !slug) return null;

    let config: TableViewConfig | ChartViewConfig;

    if (viewType === ViewType.Table) {
      config = {
        columns: tableColumns,
        pageSize: tablePageSize,
      };
    } else {
      config = {
        chartType,
        xAxis,
        yAxis,
        showLegend: true,
        showGrid: true,
      };
    }

    return {
      slug,
      name,
      description: description || undefined,
      compositionId,
      viewType,
      config,
      isActive: true,
    };
  }, [
    viewType,
    compositionId,
    name,
    slug,
    description,
    tableColumns,
    tablePageSize,
    chartType,
    xAxis,
    yAxis,
  ]);

  return {
    // Step navigation
    currentStep,
    currentStepIndex,
    steps: STEPS,
    canGoNext,
    goNext,
    goBack,

    // View type
    viewType,
    setViewType,

    // Composition
    compositionId,
    setCompositionId,

    // Metadata
    name,
    slug,
    description,
    handleNameChange,
    setSlug,
    setDescription,

    // Table config
    tableColumns,
    tablePageSize,
    setTablePageSize,
    toggleTableColumn,

    // Chart config
    chartType,
    setChartType,
    xAxis,
    setXAxis,
    yAxis,
    toggleYAxis,

    // Build
    buildRequest,
  };
}
