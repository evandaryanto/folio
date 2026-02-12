import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import type { TableViewConfig } from "@folio/contract/view";

interface TableViewProps {
  config: TableViewConfig;
  data: Record<string, unknown>[];
  isLoading?: boolean;
}

export function TableView({ config, data, isLoading }: TableViewProps) {
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return config.columns.map((col) => ({
      accessorKey: col.field,
      header: col.label ?? col.field,
      size: col.width,
      cell: ({ getValue }) => {
        const value = getValue();
        if (value === null || value === undefined) {
          return <span className="text-muted-foreground">—</span>;
        }
        if (typeof value === "number") {
          return (
            <span className="font-mono">
              {Number.isInteger(value)
                ? value.toLocaleString()
                : value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
            </span>
          );
        }
        return String(value);
      },
    }));
  }, [config.columns]);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      pageSize={config.pageSize ?? 20}
      emptyMessage="No data returned from composition"
    />
  );
}
