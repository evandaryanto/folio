import { useMemo } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { FieldResponse } from "@folio/contract/field";

interface FieldsListProps {
  fields: FieldResponse[] | undefined;
  isLoading: boolean;
  onAddField?: () => void;
  onEditField?: (field: FieldResponse) => void;
  onDeleteField?: (fieldId: string) => void;
}

export function FieldsList({
  fields,
  isLoading,
  onAddField,
  onEditField,
  onDeleteField,
}: FieldsListProps) {
  // Sort fields by sortOrder
  const sortedFields = useMemo(
    () => (fields ? [...fields].sort((a, b) => a.sortOrder - b.sortOrder) : []),
    [fields],
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold">
            Field Definitions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">
          Field Definitions
        </CardTitle>
        {onAddField && (
          <Button variant="outline" size="sm" onClick={onAddField}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Field
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {sortedFields.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground">
            No fields defined yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedFields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors group"
              >
                <span className="font-medium min-w-[140px]">{field.name}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {field.fieldType}
                </Badge>
                {field.isRequired && (
                  <Badge variant="destructive" className="text-[10px]">
                    REQUIRED
                  </Badge>
                )}
                {field.isUnique && (
                  <Badge variant="secondary" className="text-[10px]">
                    UNIQUE
                  </Badge>
                )}
                {!field.isRequired && !field.isUnique && (
                  <span className="text-[11px] text-muted-foreground">
                    optional
                  </span>
                )}
                <code className="font-mono text-xs text-muted-foreground">
                  {field.slug}
                </code>
                <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditField && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditField(field)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {onDeleteField && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteField(field.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
