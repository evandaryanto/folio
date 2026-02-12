import { useState, useRef } from "react";
import { Loader2, Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FieldResponse } from "@folio/contract/field";
import {
  parseCsvFile,
  validateCsvHeaders,
  coerceCsvRow,
  type ParsedCsvResult,
} from "@/lib/csv-utils";

const BATCH_SIZE = 500;

interface CsvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: FieldResponse[];
  onImport: (
    records: Array<{ data: Record<string, unknown> }>,
  ) => Promise<void>;
  isLoading: boolean;
}

export function CsvImportModal({
  open,
  onOpenChange,
  fields,
  onImport,
  isLoading,
}: CsvImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCsvResult | null>(null);
  const [headerInfo, setHeaderInfo] = useState<{
    matched: string[];
    unmatched: string[];
  } | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState<string>("");

  const handleReset = () => {
    setParsedCsv(null);
    setHeaderInfo(null);
    setImportErrors([]);
    setProgress("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) handleReset();
    onOpenChange(open);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrors([]);
    setProgress("");

    const result = await parseCsvFile(file);

    if (result.errors.length > 0) {
      setImportErrors(result.errors);
      return;
    }

    if (result.rows.length === 0) {
      setImportErrors(["CSV file is empty or has no data rows."]);
      return;
    }

    const info = validateCsvHeaders(result.headers, fields);
    setParsedCsv(result);
    setHeaderInfo(info);
  };

  const missingRequiredFields = fields.filter(
    (f) => f.isRequired && !headerInfo?.matched.includes(f.slug),
  );

  const handleImport = async () => {
    if (!parsedCsv || !headerInfo) return;

    setImportErrors([]);
    setProgress("");

    const coercedRecords = parsedCsv.rows.map((row) => ({
      data: coerceCsvRow(row, fields),
    }));

    const totalBatches = Math.ceil(coercedRecords.length / BATCH_SIZE);

    try {
      for (let i = 0; i < totalBatches; i++) {
        const batch = coercedRecords.slice(
          i * BATCH_SIZE,
          (i + 1) * BATCH_SIZE,
        );

        if (totalBatches > 1) {
          setProgress(`Importing batch ${i + 1} of ${totalBatches}...`);
        }

        await onImport(batch);
      }

      handleOpenChange(false);
    } catch (e: unknown) {
      const error = e as {
        details?: { rowErrors?: string[] };
        message?: string;
      };
      if (error.details?.rowErrors) {
        setImportErrors(error.details.rowErrors);
      } else {
        setImportErrors([error.message || "Import failed"]);
      }
      setProgress("");
    }
  };

  const previewRows = parsedCsv?.rows.slice(0, 5) ?? [];
  const matchedFields = fields.filter((f) =>
    headerInfo?.matched.includes(f.slug),
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Records from CSV</DialogTitle>
        </DialogHeader>

        {/* Step 1: File Upload */}
        {!parsedCsv && (
          <div className="space-y-3">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Click to select a CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">
                Headers should match field slugs
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground">
                Expected columns:
              </span>
              {fields.map((f) => (
                <Badge key={f.id} variant="outline" className="text-[11px]">
                  {f.slug}
                  {f.isRequired && (
                    <span className="text-destructive ml-0.5">*</span>
                  )}
                </Badge>
              ))}
            </div>

            {importErrors.length > 0 && <ErrorDisplay errors={importErrors} />}
          </div>
        )}

        {/* Step 2+3: Header Validation + Preview */}
        {parsedCsv && headerInfo && (
          <div className="space-y-4">
            {/* Header mapping */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Column Mapping</p>
              <div className="flex flex-wrap gap-1.5">
                {headerInfo.matched.map((h) => (
                  <Badge key={h} variant="default" className="text-[11px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {h}
                  </Badge>
                ))}
                {headerInfo.unmatched.map((h) => (
                  <Badge key={h} variant="secondary" className="text-[11px]">
                    <X className="w-3 h-3 mr-1" />
                    {h}
                  </Badge>
                ))}
              </div>
              {headerInfo.unmatched.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Unmatched columns will be ignored.
                </p>
              )}
              {missingRequiredFields.length > 0 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Missing required columns:{" "}
                  {missingRequiredFields.map((f) => f.slug).join(", ")}
                </p>
              )}
            </div>

            {/* Preview table */}
            {matchedFields.length > 0 && previewRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Preview</p>
                  <Badge variant="outline" className="text-[11px]">
                    {previewRows.length} of {parsedCsv.rows.length} rows
                  </Badge>
                </div>
                <div className="border border-border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {matchedFields.map((f) => (
                          <TableHead
                            key={f.id}
                            className="text-[11px] whitespace-nowrap"
                          >
                            {f.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, i) => (
                        <TableRow key={i}>
                          {matchedFields.map((f) => (
                            <TableCell
                              key={f.id}
                              className="text-xs max-w-[200px] truncate"
                            >
                              {row[f.slug] ?? ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Errors */}
            {importErrors.length > 0 && <ErrorDisplay errors={importErrors} />}

            {/* Progress */}
            {progress && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {progress}
              </p>
            )}

            {/* Actions */}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                Change File
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  isLoading ||
                  headerInfo.matched.length === 0 ||
                  missingRequiredFields.length > 0
                }
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Import {parsedCsv.rows.length} Records
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ErrorDisplay({ errors }: { errors: string[] }) {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 max-h-40 overflow-y-auto">
      <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-1.5">
        <AlertCircle className="w-3 h-3" />
        {errors.length} error{errors.length !== 1 ? "s" : ""}
      </p>
      <ul className="space-y-0.5">
        {errors.map((err, i) => (
          <li key={i} className="text-xs text-destructive/80">
            {err}
          </li>
        ))}
      </ul>
    </div>
  );
}
