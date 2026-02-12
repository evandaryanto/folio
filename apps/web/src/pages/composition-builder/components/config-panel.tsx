import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FilterOperator,
  AggregateFunction,
  SortDirection,
  AccessLevel,
  JoinType,
} from "@folio/contract/enums";
import type { FieldResponse } from "@folio/contract/field";
import type { CollectionResponse } from "@folio/contract/collection";
import type {
  FilterConfig,
  AggregationConfig,
  SortConfig,
  JoinConfig,
} from "../hooks";

const JOIN_TYPES: Record<JoinType, string> = {
  [JoinType.Left]: "LEFT JOIN",
  [JoinType.Inner]: "INNER JOIN",
  [JoinType.Right]: "RIGHT JOIN",
};

const FILTER_OPERATORS: Record<FilterOperator, string> = {
  [FilterOperator.Eq]: "equals",
  [FilterOperator.Neq]: "not equals",
  [FilterOperator.Gt]: "greater than",
  [FilterOperator.Gte]: "greater or equal",
  [FilterOperator.Lt]: "less than",
  [FilterOperator.Lte]: "less or equal",
  [FilterOperator.Contains]: "contains",
  [FilterOperator.In]: "in list",
};

const AGGREGATE_FUNCTIONS: Record<AggregateFunction, string> = {
  [AggregateFunction.Count]: "COUNT",
  [AggregateFunction.Sum]: "SUM",
  [AggregateFunction.Avg]: "AVG",
  [AggregateFunction.Min]: "MIN",
  [AggregateFunction.Max]: "MAX",
};

const ACCESS_LEVELS: Record<
  AccessLevel,
  { label: string; description: string }
> = {
  [AccessLevel.Private]: {
    label: "Private",
    description: "Only accessible via management API",
  },
  [AccessLevel.Internal]: {
    label: "Internal",
    description: "Requires authentication",
  },
  [AccessLevel.Public]: {
    label: "Public",
    description: "No authentication required",
  },
};

interface ConfigPanelProps {
  fields: FieldResponse[];
  collections: CollectionResponse[];
  currentCollectionSlug: string;
  // Form
  name: string;
  setName: (value: string) => void;
  slug: string;
  setSlug: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  accessLevel: AccessLevel;
  setAccessLevel: (value: AccessLevel) => void;
  // Joins
  joins: JoinConfig[];
  addJoin: () => void;
  updateJoin: (id: string, updates: Partial<JoinConfig>) => void;
  removeJoin: (id: string) => void;
  // Filters
  filters: FilterConfig[];
  addFilter: () => void;
  updateFilter: (id: string, updates: Partial<FilterConfig>) => void;
  removeFilter: (id: string) => void;
  // GroupBy
  groupBy: string[];
  toggleGroupBy: (field: string) => void;
  // Aggregations
  aggregations: AggregationConfig[];
  addAggregation: () => void;
  updateAggregation: (id: string, updates: Partial<AggregationConfig>) => void;
  removeAggregation: (id: string) => void;
  // Sort
  sorts: SortConfig[];
  addSort: () => void;
  updateSort: (id: string, updates: Partial<SortConfig>) => void;
  removeSort: (id: string) => void;
  // Limit
  limit: number | undefined;
  setLimit: (value: number | undefined) => void;
  // Errors
  errors: Record<string, string>;
}

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  badge,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <span>{icon}</span>
        <span className="font-medium text-sm">{title}</span>
        {badge !== undefined && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {badge}
          </Badge>
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function ConfigPanel({
  fields,
  collections,
  currentCollectionSlug,
  name,
  setName,
  slug,
  setSlug,
  description,
  setDescription,
  accessLevel,
  setAccessLevel,
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
  errors,
}: ConfigPanelProps) {
  // Filter out current collection from join options
  const joinableCollections = collections.filter(
    (c) => c.slug !== currentCollectionSlug,
  );
  return (
    <div className="h-full overflow-y-auto">
      {/* Basic Info */}
      <Section title="Basic Info" icon="📝" defaultOpen={true}>
        <div className="space-y-3">
          <div>
            <Label htmlFor="comp-name" className="text-xs">
              Name <span className="text-destructive">*</span>
            </Label>
            <input
              id="comp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g., Expenses by Category"
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="comp-slug" className="text-xs">
              Slug <span className="text-destructive">*</span>
            </Label>
            <input
              id="comp-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={`${inputClass} font-mono`}
              placeholder="e.g., expenses-by-category"
            />
            {errors.slug && (
              <p className="text-xs text-destructive mt-1">{errors.slug}</p>
            )}
          </div>
          <div>
            <Label htmlFor="comp-desc" className="text-xs">
              Description
            </Label>
            <textarea
              id="comp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="Optional description..."
            />
          </div>
          <div>
            <Label className="text-xs">Access Level</Label>
            <Select
              value={accessLevel}
              onValueChange={(v) => setAccessLevel(v as AccessLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCESS_LEVELS).map(
                  ([value, { label, description }]) => (
                    <SelectItem key={value} value={value}>
                      <div>
                        <div>{label}</div>
                        <div className="text-xs text-muted-foreground">
                          {description}
                        </div>
                      </div>
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* Joins */}
      <Section
        title="Joins"
        icon="🔗"
        badge={joins.length || undefined}
        defaultOpen={joins.length > 0}
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Join data from other collections
          </p>
          {joins.map((join) => (
            <div key={join.id} className="p-3 bg-muted/50 rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <Select
                  value={join.type}
                  onValueChange={(v) =>
                    updateJoin(join.id, { type: v as JoinType })
                  }
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(JOIN_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={join.collection}
                  onValueChange={(v) => updateJoin(join.id, { collection: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {joinableCollections.map((c) => (
                      <SelectItem key={c.id} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeJoin(join.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">ON</span>
                <input
                  type="text"
                  value={join.leftField}
                  onChange={(e) =>
                    updateJoin(join.id, { leftField: e.target.value })
                  }
                  className={`${inputClass} flex-1 font-mono text-xs`}
                  placeholder={`${currentCollectionSlug}.field`}
                />
                <span className="text-muted-foreground">=</span>
                <input
                  type="text"
                  value={join.rightField}
                  onChange={(e) =>
                    updateJoin(join.id, { rightField: e.target.value })
                  }
                  className={`${inputClass} flex-1 font-mono text-xs`}
                  placeholder={`${join.collection || "collection"}.field`}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addJoin}
            className="w-full"
            disabled={joinableCollections.length === 0}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Join
          </Button>
          {joinableCollections.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              No other collections available to join
            </p>
          )}
        </div>
      </Section>

      {/* Filters */}
      <Section
        title="Filters"
        icon="🔍"
        badge={filters.length || undefined}
        defaultOpen={filters.length > 0}
      >
        <div className="space-y-3">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className="p-3 bg-muted/50 rounded-md space-y-2"
            >
              <div className="flex items-center gap-2">
                <Select
                  value={filter.field}
                  onValueChange={(v) => updateFilter(filter.id, { field: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.id} value={f.slug}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeFilter(filter.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Select
                  value={filter.operator}
                  onValueChange={(v) =>
                    updateFilter(filter.id, { operator: v as FilterOperator })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FILTER_OPERATORS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filter.useParam ? (
                  <input
                    type="text"
                    value={filter.param}
                    onChange={(e) =>
                      updateFilter(filter.id, { param: e.target.value })
                    }
                    className={`${inputClass} flex-1 font-mono`}
                    placeholder="param_name"
                  />
                ) : (
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) =>
                      updateFilter(filter.id, { value: e.target.value })
                    }
                    className={`${inputClass} flex-1`}
                    placeholder="Value"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`param-${filter.id}`}
                  checked={filter.useParam}
                  onCheckedChange={(checked) =>
                    updateFilter(filter.id, { useParam: checked === true })
                  }
                />
                <Label
                  htmlFor={`param-${filter.id}`}
                  className="text-xs text-muted-foreground"
                >
                  Use URL parameter
                </Label>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFilter}
            className="w-full"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Filter
          </Button>
        </div>
      </Section>

      {/* Group By */}
      <Section
        title="Group By"
        icon="📦"
        badge={groupBy.length || undefined}
        defaultOpen={groupBy.length > 0}
      >
        <div className="space-y-2">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center gap-2">
              <Checkbox
                id={`group-${field.id}`}
                checked={groupBy.includes(field.slug)}
                onCheckedChange={() => toggleGroupBy(field.slug)}
              />
              <Label
                htmlFor={`group-${field.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {field.name}
              </Label>
              <Badge variant="outline" className="ml-auto text-[10px]">
                {field.fieldType}
              </Badge>
            </div>
          ))}
        </div>
      </Section>

      {/* Aggregations */}
      <Section
        title="Aggregations"
        icon="Σ"
        badge={aggregations.length || undefined}
        defaultOpen={aggregations.length > 0}
      >
        <div className="space-y-3">
          {aggregations.map((agg) => (
            <div key={agg.id} className="p-3 bg-muted/50 rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <Select
                  value={agg.function}
                  onValueChange={(v) =>
                    updateAggregation(agg.id, {
                      function: v as AggregateFunction,
                    })
                  }
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AGGREGATE_FUNCTIONS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <Select
                  value={agg.field}
                  onValueChange={(v) => updateAggregation(agg.id, { field: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">* (all rows)</SelectItem>
                    {fields.map((f) => (
                      <SelectItem key={f.id} value={f.slug}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeAggregation(agg.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Output alias
                </Label>
                <input
                  type="text"
                  value={agg.alias}
                  onChange={(e) =>
                    updateAggregation(agg.id, { alias: e.target.value })
                  }
                  className={`${inputClass} font-mono`}
                  placeholder="e.g., total_amount"
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAggregation}
            className="w-full"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Aggregation
          </Button>
        </div>
      </Section>

      {/* Sort */}
      <Section
        title="Sort"
        icon="↕"
        badge={sorts.length || undefined}
        defaultOpen={sorts.length > 0}
      >
        <div className="space-y-3">
          {sorts.map((sort) => (
            <div key={sort.id} className="flex items-center gap-2">
              <Select
                value={sort.field}
                onValueChange={(v) => updateSort(sort.id, { field: v })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.id} value={f.slug}>
                      {f.name}
                    </SelectItem>
                  ))}
                  {aggregations
                    .filter((a) => a.alias)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.alias}>
                        {a.alias} (aggregation)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select
                value={sort.direction}
                onValueChange={(v) =>
                  updateSort(sort.id, { direction: v as SortDirection })
                }
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SortDirection.Asc}>ASC ↑</SelectItem>
                  <SelectItem value={SortDirection.Desc}>DESC ↓</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeSort(sort.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSort}
            className="w-full"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Sort
          </Button>
        </div>
      </Section>

      {/* Limit */}
      <Section title="Limit" icon="📊" defaultOpen={!!limit}>
        <div>
          <Label htmlFor="limit" className="text-xs">
            Max results
          </Label>
          <input
            id="limit"
            type="number"
            value={limit ?? ""}
            onChange={(e) =>
              setLimit(
                e.target.value ? parseInt(e.target.value, 10) : undefined,
              )
            }
            className={inputClass}
            placeholder="No limit"
            min={1}
          />
        </div>
      </Section>
    </div>
  );
}
