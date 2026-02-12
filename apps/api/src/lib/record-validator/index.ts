/**
 * Record Validator
 *
 * Validates record data against collection field schema.
 * Enforces required fields, types, and constraints.
 */

import type { Field, FieldOptions } from "@folio/db/schema";
import { FieldType } from "@folio/contract/enums";

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
  data: Record<string, unknown>; // Normalized data with defaults applied
}

/**
 * Validates record data against the collection's field schema.
 * Returns validation errors or normalized data with defaults applied.
 */
export function validateRecord(
  data: Record<string, unknown>,
  fields: Field[],
  options: { isUpdate?: boolean } = {},
): ValidationResult {
  const errors: FieldError[] = [];
  const normalizedData: Record<string, unknown> = { ...data };
  const fieldMap = new Map(fields.map((f) => [f.slug, f]));

  // Check for unknown fields (fields not in schema)
  for (const key of Object.keys(data)) {
    if (!fieldMap.has(key)) {
      errors.push({
        field: key,
        message: `Unknown field '${key}' not defined in schema`,
      });
    }
  }

  // Validate each field in schema
  for (const field of fields) {
    const value = data[field.slug];
    const hasValue = value !== undefined && value !== null;

    // Check required fields (skip for updates unless value is explicitly null)
    if (field.isRequired && !hasValue && !options.isUpdate) {
      errors.push({
        field: field.slug,
        message: `Required field '${field.slug}' is missing`,
      });
      continue;
    }

    // Apply default value if not provided (only for create)
    if (!hasValue && !options.isUpdate && field.defaultValue !== null) {
      normalizedData[field.slug] = field.defaultValue;
      continue;
    }

    // Skip validation if no value (optional field)
    if (!hasValue) {
      continue;
    }

    // Validate type and constraints
    const fieldErrors = validateFieldValue(
      field.slug,
      value,
      field.fieldType as FieldType,
      field.options as FieldOptions | null,
    );
    errors.push(...fieldErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: normalizedData,
  };
}

/**
 * Validates a single field value against its type and constraints.
 */
function validateFieldValue(
  slug: string,
  value: unknown,
  fieldType: FieldType,
  options: FieldOptions | null,
): FieldError[] {
  const errors: FieldError[] = [];

  switch (fieldType) {
    case FieldType.Text:
    case FieldType.Textarea:
      if (typeof value !== "string") {
        errors.push({
          field: slug,
          message: `Field '${slug}' must be a string`,
        });
      } else {
        // Check minLength
        if (
          options?.minLength !== undefined &&
          value.length < options.minLength
        ) {
          errors.push({
            field: slug,
            message: `Field '${slug}' must be at least ${options.minLength} characters`,
          });
        }
        // Check maxLength
        if (
          options?.maxLength !== undefined &&
          value.length > options.maxLength
        ) {
          errors.push({
            field: slug,
            message: `Field '${slug}' must be at most ${options.maxLength} characters`,
          });
        }
        // Check pattern
        if (options?.pattern !== undefined) {
          const regex = new RegExp(options.pattern);
          if (!regex.test(value)) {
            errors.push({
              field: slug,
              message: `Field '${slug}' does not match required pattern`,
            });
          }
        }
      }
      break;

    case FieldType.Number:
      if (typeof value !== "number" || isNaN(value)) {
        errors.push({
          field: slug,
          message: `Field '${slug}' must be a number`,
        });
      } else {
        // Check min
        if (options?.min !== undefined && value < options.min) {
          errors.push({
            field: slug,
            message: `Field '${slug}' must be at least ${options.min}`,
          });
        }
        // Check max
        if (options?.max !== undefined && value > options.max) {
          errors.push({
            field: slug,
            message: `Field '${slug}' must be at most ${options.max}`,
          });
        }
      }
      break;

    case FieldType.Boolean:
      if (typeof value !== "boolean") {
        errors.push({
          field: slug,
          message: `Field '${slug}' must be a boolean`,
        });
      }
      break;

    case FieldType.Date:
      if (typeof value !== "string" || !isValidDate(value)) {
        errors.push({
          field: slug,
          message: `Field '${slug}' must be a valid date (YYYY-MM-DD)`,
        });
      }
      break;

    case FieldType.Datetime:
      if (typeof value !== "string" || !isValidDatetime(value)) {
        errors.push({
          field: slug,
          message: `Field '${slug}' must be a valid datetime (ISO 8601)`,
        });
      }
      break;

    case FieldType.Select:
      if (typeof value !== "string") {
        errors.push({
          field: slug,
          message: `Field '${slug}' must be a string`,
        });
      } else if (options?.choices) {
        const validChoices = options.choices.map((c) => c.value);
        if (!validChoices.includes(value)) {
          errors.push({
            field: slug,
            message: `Field '${slug}' must be one of: ${validChoices.join(", ")}`,
          });
        }
      }
      break;

    case FieldType.MultiSelect:
      if (!Array.isArray(value)) {
        errors.push({
          field: slug,
          message: `Field '${slug}' must be an array`,
        });
      } else if (options?.choices) {
        const validChoices = options.choices.map((c) => c.value);
        for (const item of value) {
          if (typeof item !== "string" || !validChoices.includes(item)) {
            errors.push({
              field: slug,
              message: `Field '${slug}' contains invalid choice '${item}'. Must be one of: ${validChoices.join(", ")}`,
            });
            break;
          }
        }
      }
      break;

    case FieldType.Relation:
      // Relation should be a string (ULID reference)
      if (typeof value !== "string") {
        errors.push({
          field: slug,
          message: `Field '${slug}' must be a string (record ID)`,
        });
      }
      break;

    case FieldType.Json:
      // JSON can be any valid JSON value (object, array, etc.)
      if (value === undefined) {
        errors.push({
          field: slug,
          message: `Field '${slug}' must be valid JSON`,
        });
      }
      break;

    default:
      // Unknown field type - skip validation
      break;
  }

  return errors;
}

/**
 * Validates a date string (YYYY-MM-DD)
 */
function isValidDate(value: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    return false;
  }
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validates a datetime string (ISO 8601)
 */
function isValidDatetime(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export { type Field, type FieldOptions };
