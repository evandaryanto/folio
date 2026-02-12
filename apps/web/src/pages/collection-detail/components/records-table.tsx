import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { RecordResponse } from "@folio/contract/record";
import type { FieldResponse } from "@folio/contract/field";
import { FieldType } from "@folio/contract/enums";

interface RecordsTableProps {
  records: RecordResponse[] | undefined;
  fields: FieldResponse[] | undefined;
  isLoading: boolean;
}

export function RecordsTable({
  records,
  fields,
  isLoading,
}: RecordsTableProps) {
  // Sort fields by sortOrder
  const sortedFields = useMemo(
    () => (fields ? [...fields].sort((a, b) => a.sortOrder - b.sortOrder) : []),
    [fields],
  );

  // Build columns dynamically from fields
  const columns = useMemo<ColumnDef<RecordResponse>[]>(() => {
    const cols: ColumnDef<RecordResponse>[] = [
      {
        accessorKey: "id",
        header: () => (
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            ID
          </span>
        ),
        cell: ({ row }) => (
          <code className="font-mono text-xs text-muted-foreground">
            {row.original.id.slice(0, 4)}..{row.original.id.slice(-2)}
          </code>
        ),
      },
    ];

    for (const field of sortedFields) {
      cols.push({
        accessorKey: `data.${field.slug}`,
        header: () => (
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {field.name}
          </span>
        ),
        cell: ({ row }) => (
          <CellValue
            value={row.original.data[field.slug]}
            fieldType={field.fieldType}
          />
        ),
      });
    }

    return cols;
  }, [sortedFields]);

  return (
    <DataTable
      columns={columns}
      data={records ?? []}
      isLoading={isLoading}
      emptyMessage="No records yet"
      getRowId={(row) => row.id}
    />
  );
}

function CellValue({
  value,
  fieldType,
}: {
  value: unknown;
  fieldType: FieldType;
}) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (fieldType) {
    case FieldType.Number: {
      const num = Number(value);
      if (num >= 1000) {
        return <code className="font-mono text-xs">{formatCurrency(num)}</code>;
      }
      return <code className="font-mono text-xs">{num.toLocaleString()}</code>;
    }

    case FieldType.Boolean:
      return value ? (
        <Badge
          variant="default"
          className="bg-success/10 text-success border-success/20"
        >
          ✓ Yes
        </Badge>
      ) : (
        <Badge variant="secondary">No</Badge>
      );

    case FieldType.Date:
    case FieldType.Datetime:
      return <code className="font-mono text-xs">{String(value)}</code>;

    case FieldType.Select:
    case FieldType.MultiSelect: {
      const options = Array.isArray(value) ? value : [value];
      return (
        <div className="flex gap-1 flex-wrap">
          {options.map((opt, i) => (
            <Badge key={i} variant="secondary">
              {String(opt)}
            </Badge>
          ))}
        </div>
      );
    }

    case FieldType.Json:
      return (
        <code className="font-mono text-xs text-muted-foreground">
          {JSON.stringify(value).slice(0, 30)}...
        </code>
      );

    default:
      return <span className="text-sm">{String(value)}</span>;
  }
}
