import Papa from "papaparse";
import type { FieldResponse } from "@folio/contract/field";
import { FieldType } from "@folio/contract/enums";

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCsvFile(file: File): Promise<ParsedCsvResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          headers: results.meta.fields ?? [],
          rows: results.data as Record<string, string>[],
          errors: results.errors.map((e) => `Row ${e.row}: ${e.message}`),
        });
      },
      error: (error: Error) => {
        resolve({
          headers: [],
          rows: [],
          errors: [error.message],
        });
      },
    });
  });
}

export function validateCsvHeaders(
  headers: string[],
  fields: FieldResponse[],
): { matched: string[]; unmatched: string[] } {
  const slugSet = new Set(fields.map((f) => f.slug));
  const matched: string[] = [];
  const unmatched: string[] = [];
  for (const h of headers) {
    if (slugSet.has(h)) {
      matched.push(h);
    } else {
      unmatched.push(h);
    }
  }
  return { matched, unmatched };
}

export function coerceCsvRow(
  row: Record<string, string>,
  fields: FieldResponse[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const fieldMap = new Map(fields.map((f) => [f.slug, f]));

  for (const [key, rawValue] of Object.entries(row)) {
    const field = fieldMap.get(key);
    if (!field) continue;

    if (rawValue === "" || rawValue === undefined) continue;

    switch (field.fieldType) {
      case FieldType.Number: {
        const num = Number(rawValue);
        result[key] = isNaN(num) ? rawValue : num;
        break;
      }
      case FieldType.Boolean: {
        const lower = rawValue.toLowerCase().trim();
        if (["true", "1", "yes"].includes(lower)) result[key] = true;
        else if (["false", "0", "no"].includes(lower)) result[key] = false;
        else result[key] = rawValue;
        break;
      }
      case FieldType.MultiSelect: {
        result[key] = rawValue
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
        break;
      }
      case FieldType.Json: {
        try {
          result[key] = JSON.parse(rawValue);
        } catch {
          result[key] = rawValue;
        }
        break;
      }
      default:
        result[key] = rawValue;
    }
  }

  return result;
}
