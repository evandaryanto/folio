import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCollection } from "@/hooks/use-collections";
import { useFields } from "@/hooks/use-fields";
import {
  useCreateComposition,
  useCompositionBySlug,
  useUpdateComposition,
  usePreviewComposition,
} from "@/hooks/use-compositions";
import { useApp } from "@/providers";
import { routes } from "@/lib/routes";
import {
  FilterOperator,
  AggregateFunction,
  SortDirection,
  AccessLevel,
  JoinType,
} from "@folio/contract/enums";
import type { CompositionConfigRequest } from "@folio/contract/composition";
import { useCollections } from "@/hooks/use-collections";

export interface JoinConfig {
  id: string;
  collection: string;
  leftField: string;
  rightField: string;
  type: JoinType;
}

export interface FilterConfig {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
  useParam: boolean;
  param: string;
}

export interface AggregationConfig {
  id: string;
  field: string;
  function: AggregateFunction;
  alias: string;
}

export interface SortConfig {
  id: string;
  field: string;
  direction: SortDirection;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function useCompositionBuilder() {
  const { slug: collectionSlug, compositionSlug } = useParams<{
    slug: string;
    compositionSlug?: string;
  }>();
  const navigate = useNavigate();
  const { user } = useApp();

  const isEditMode = !!compositionSlug;

  // Fetch collection and fields
  const { data: collection, isLoading: collectionLoading } = useCollection(
    collectionSlug ?? "",
  );
  const { data: fields, isLoading: fieldsLoading } = useFields(collection?.id);

  // Fetch all collections for joins
  const { data: allCollections } = useCollections();

  // Fetch existing composition if editing
  const { data: existingComposition, isLoading: compositionLoading } =
    useCompositionBySlug(isEditMode ? compositionSlug : undefined);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(
    AccessLevel.Private,
  );

  // Config state
  const [joins, setJoins] = useState<JoinConfig[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [aggregations, setAggregations] = useState<AggregationConfig[]>([]);
  const [sorts, setSorts] = useState<SortConfig[]>([]);
  const [limit, setLimit] = useState<number | undefined>(undefined);

  // Initialize form from existing composition
  useEffect(() => {
    if (existingComposition) {
      setName(existingComposition.name);
      setSlug(existingComposition.slug);
      setDescription(existingComposition.description ?? "");
      setAccessLevel(existingComposition.accessLevel);

      const config = existingComposition.config;
      if (config.joins) {
        setJoins(
          config.joins.map((j) => ({
            id: generateId(),
            collection: j.collection,
            leftField: j.on.left,
            rightField: j.on.right,
            type: j.type,
          })),
        );
      }
      if (config.filters) {
        setFilters(
          config.filters.map((f) => ({
            id: generateId(),
            field: f.field,
            operator: f.operator,
            value: String(f.value ?? ""),
            useParam: !!f.param,
            param: f.param ?? "",
          })),
        );
      }
      if (config.groupBy) {
        setGroupBy(config.groupBy);
      }
      if (config.aggregations) {
        setAggregations(
          config.aggregations.map((a) => ({
            id: generateId(),
            field: a.field,
            function: a.function,
            alias: a.alias,
          })),
        );
      }
      if (config.sort) {
        setSorts(
          config.sort.map((s) => ({
            id: generateId(),
            field: s.field,
            direction: s.direction,
          })),
        );
      }
      if (config.limit) {
        setLimit(config.limit);
      }
    }
  }, [existingComposition]);

  // Preview state
  const [previewResult, setPreviewResult] = useState<{
    success: boolean;
    data?: Record<string, unknown>[];
    error?: { message: string; field?: string };
  } | null>(null);

  // Mutations
  const createComposition = useCreateComposition();
  const updateComposition = useUpdateComposition(existingComposition?.id);
  const previewComposition = usePreviewComposition();

  // Slug generation
  const generateSlug = useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, []);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (!isEditMode && (!slug || slug === generateSlug(name))) {
        setSlug(generateSlug(value));
      }
    },
    [isEditMode, slug, name, generateSlug],
  );

  // Join management
  const addJoin = useCallback(() => {
    setJoins((prev) => [
      ...prev,
      {
        id: generateId(),
        collection: "",
        leftField: "",
        rightField: "",
        type: JoinType.Left,
      },
    ]);
  }, []);

  const updateJoin = useCallback((id: string, updates: Partial<JoinConfig>) => {
    setJoins((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    );
  }, []);

  const removeJoin = useCallback((id: string) => {
    setJoins((prev) => prev.filter((j) => j.id !== id));
  }, []);

  // Filter management
  const addFilter = useCallback(() => {
    setFilters((prev) => [
      ...prev,
      {
        id: generateId(),
        field: "",
        operator: FilterOperator.Eq,
        value: "",
        useParam: false,
        param: "",
      },
    ]);
  }, []);

  const updateFilter = useCallback(
    (id: string, updates: Partial<FilterConfig>) => {
      setFilters((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      );
    },
    [],
  );

  const removeFilter = useCallback((id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // GroupBy management
  const toggleGroupBy = useCallback((field: string) => {
    setGroupBy((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  }, []);

  // Aggregation management
  const addAggregation = useCallback(() => {
    setAggregations((prev) => [
      ...prev,
      {
        id: generateId(),
        field: "",
        function: AggregateFunction.Count,
        alias: "",
      },
    ]);
  }, []);

  const updateAggregation = useCallback(
    (id: string, updates: Partial<AggregationConfig>) => {
      setAggregations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      );
    },
    [],
  );

  const removeAggregation = useCallback((id: string) => {
    setAggregations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Sort management
  const addSort = useCallback(() => {
    setSorts((prev) => [
      ...prev,
      {
        id: generateId(),
        field: "",
        direction: SortDirection.Asc,
      },
    ]);
  }, []);

  const updateSort = useCallback((id: string, updates: Partial<SortConfig>) => {
    setSorts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  }, []);

  const removeSort = useCallback((id: string) => {
    setSorts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Build config object
  const config = useMemo((): CompositionConfigRequest => {
    const result: CompositionConfigRequest = {
      from: collectionSlug ?? "",
    };

    if (joins.length > 0) {
      result.joins = joins
        .filter((j) => j.collection && j.leftField && j.rightField)
        .map((j) => ({
          collection: j.collection,
          on: {
            left: j.leftField,
            right: j.rightField,
          },
          type: j.type,
        }));
    }

    if (filters.length > 0) {
      result.filters = filters
        .filter((f) => f.field)
        .map((f) => ({
          field: f.field,
          operator: f.operator,
          ...(f.useParam ? { param: f.param } : { value: f.value }),
        }));
    }

    if (groupBy.length > 0) {
      result.groupBy = groupBy;
    }

    if (aggregations.length > 0) {
      result.aggregations = aggregations
        .filter((a) => a.field && a.alias)
        .map((a) => ({
          field: a.field,
          function: a.function,
          alias: a.alias,
        }));
    }

    if (sorts.length > 0) {
      result.sort = sorts
        .filter((s) => s.field)
        .map((s) => ({
          field: s.field,
          direction: s.direction,
        }));
    }

    if (limit) {
      result.limit = limit;
    }

    return result;
  }, [collectionSlug, joins, filters, groupBy, aggregations, sorts, limit]);

  // Validation
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!slug.trim()) errs.slug = "Slug is required";
    else if (!/^[a-z0-9_-]+$/.test(slug)) errs.slug = "Invalid slug format";
    return errs;
  }, [name, slug]);

  const isValid = Object.keys(errors).length === 0;

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!isValid) return;

    try {
      if (isEditMode) {
        await updateComposition.mutateAsync({
          name,
          description: description || undefined,
          config,
          accessLevel,
        });
      } else {
        await createComposition.mutateAsync({
          slug,
          name,
          description: description || undefined,
          config,
          accessLevel,
          isActive: true,
        });
      }
      navigate(routes.collectionDetail(collectionSlug ?? ""));
    } catch (error) {
      console.error("Failed to save composition:", error);
    }
  }, [
    isValid,
    isEditMode,
    name,
    slug,
    description,
    config,
    accessLevel,
    createComposition,
    updateComposition,
    navigate,
    collectionSlug,
  ]);

  // Endpoint URL preview
  const endpointUrl = useMemo(() => {
    const workspaceSlug = user?.workspaceSlug ?? "workspace";
    return `/api/v1/c/${workspaceSlug}/${slug || "your-api-slug"}`;
  }, [user?.workspaceSlug, slug]);

  // Preview/test composition
  const handlePreview = useCallback(async () => {
    setPreviewResult(null);
    try {
      const result = await previewComposition.mutateAsync({ config });
      setPreviewResult(result);
    } catch (error) {
      setPreviewResult({
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Preview failed",
        },
      });
    }
  }, [config, previewComposition]);

  const clearPreview = useCallback(() => {
    setPreviewResult(null);
  }, []);

  return {
    // Route params
    collectionSlug,
    isEditMode,

    // Loading states
    isLoading:
      collectionLoading || fieldsLoading || (isEditMode && compositionLoading),
    isSaving: createComposition.isPending || updateComposition.isPending,

    // Data
    collection,
    fields: fields ?? [],
    collections: allCollections ?? [],
    existingComposition,

    // Form state
    name,
    setName: handleNameChange,
    slug,
    setSlug,
    description,
    setDescription,
    accessLevel,
    setAccessLevel,

    // Config state
    joins,
    addJoin,
    updateJoin,
    removeJoin,
    filters,
    addFilter,
    updateFilter,
    removeFilter,
    groupBy,
    toggleGroupBy,
    aggregations,
    addAggregation,
    updateAggregation,
    removeAggregation,
    sorts,
    addSort,
    updateSort,
    removeSort,
    limit,
    setLimit,

    // Computed
    config,
    errors,
    isValid,
    endpointUrl,

    // Actions
    handleSubmit,
    goBack: () => navigate(routes.collectionDetail(collectionSlug ?? "")),

    // Preview
    previewResult,
    isPreviewLoading: previewComposition.isPending,
    handlePreview,
    clearPreview,
  };
}
