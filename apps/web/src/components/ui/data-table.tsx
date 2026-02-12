import { useMemo } from "react";
import type {
  ColumnDef,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CustomHeader {
  header: string;
  accessorKey: string;
  colSpan: number;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  customColumns?: CustomHeader[];
  data: TData[];
  isLoading?: boolean;
  currentPage?: number;
  pageSize?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: TData, index: number) => string;
  emptyMessage?: string;
}

export function DataTable<TData, TValue>({
  columns = [],
  customColumns = [],
  data = [],
  isLoading,
  currentPage = 1,
  pageSize = 10,
  totalRecords,
  onPageChange,
  rowSelection = {},
  onRowSelectionChange,
  getRowId = (_, index) => index.toString(),
  emptyMessage = "No data available",
}: DataTableProps<TData, TValue>) {
  const sortedData = useMemo(() => {
    if (!data.length || Object.keys(rowSelection).length === 0) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aIndex = getRowId(a, data.indexOf(a));
      const bIndex = getRowId(b, data.indexOf(b));

      const aSelected = rowSelection[aIndex] || false;
      const bSelected = rowSelection[bIndex] || false;

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [data, rowSelection, getRowId]);

  const table = useReactTable({
    data: sortedData,
    columns,
    state: {
      rowSelection,
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    onRowSelectionChange,
  });

  const safePageSize = pageSize > 0 ? pageSize : 10;
  const hasExplicitTotal =
    typeof totalRecords === "number" &&
    !Number.isNaN(totalRecords) &&
    totalRecords > 0;

  let totalPages = 1;
  if (hasExplicitTotal) {
    totalPages = Math.max(1, Math.ceil(totalRecords / safePageSize));
  } else {
    if ((data?.length || 0) >= safePageSize) {
      totalPages = Math.max(1, currentPage + 1);
    } else {
      totalPages = Math.max(1, currentPage);
    }
  }

  const showPagination = onPageChange && (hasExplicitTotal || data.length > 0);

  return (
    <div className="overflow-hidden border border-border rounded-lg">
      <Table>
        <TableHeader className="bg-card">
          {customColumns.length > 0 && (
            <TableRow>
              {customColumns.map((headercol) => (
                <TableHead
                  key={headercol.accessorKey}
                  colSpan={headercol.colSpan}
                  className="font-semibold text-center"
                >
                  {headercol.header}
                </TableHead>
              ))}
            </TableRow>
          )}
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {hasExplicitTotal && (
              <>
                {(currentPage - 1) * safePageSize + 1}-
                {Math.min(currentPage * safePageSize, totalRecords)} of{" "}
                {totalRecords}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
