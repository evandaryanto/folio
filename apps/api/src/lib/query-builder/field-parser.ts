import type { FieldExpression, FieldFunction } from "./types";

const VALID_FIELD_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const QUALIFIED_FIELD_REGEX =
  /^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)$/;
const FUNCTION_EXPR_REGEX = /^(\w+)\((\w+)\)$/;

const VALID_FUNCTIONS: Set<FieldFunction> = new Set([
  "month",
  "year",
  "day",
  "date",
]);

const FIELD_FUNCTION_SQL: Record<
  FieldFunction,
  (field: string, tableAlias: string) => string
> = {
  month: (field, tableAlias) =>
    `to_char((${tableAlias}.data->>'${field}')::date, 'YYYY-MM')`,
  year: (field, tableAlias) =>
    `to_char((${tableAlias}.data->>'${field}')::date, 'YYYY')`,
  day: (field, tableAlias) =>
    `to_char((${tableAlias}.data->>'${field}')::date, 'YYYY-MM-DD')`,
  date: (field, tableAlias) => `(${tableAlias}.data->>'${field}')::date`,
};

/**
 * Validates that a field name is safe for SQL usage.
 * Only allows alphanumeric characters and underscores, must start with letter or underscore.
 * @throws Error if field name is invalid
 */
export function sanitizeFieldName(field: string): string {
  if (!VALID_FIELD_NAME_REGEX.test(field)) {
    throw new Error(
      `Invalid field name: "${field}". Only alphanumeric characters and underscores allowed, must start with letter or underscore.`,
    );
  }
  return field;
}

/**
 * Parses a qualified field name like "collection.field" into its parts.
 * Returns null if not a qualified field.
 */
export function parseQualifiedField(
  field: string,
): { collection: string; field: string } | null {
  const match = field.match(QUALIFIED_FIELD_REGEX);
  if (match) {
    return { collection: match[1], field: match[2] };
  }
  return null;
}

/**
 * Validates that a function name is in the allowed list.
 */
function isValidFunction(func: string): func is FieldFunction {
  return VALID_FUNCTIONS.has(func as FieldFunction);
}

/**
 * Parses a field expression string into a structured FieldExpression object.
 *
 * Examples:
 * - "category" → { type: "simple", field: "category" }
 * - "month(date)" → { type: "function", function: "month", field: "date" }
 * - "accounts.type" → { type: "qualified", collection: "accounts", field: "type" }
 *
 * @throws Error if function is unknown or field name is invalid
 */
export function parseFieldExpression(expr: string): FieldExpression {
  // Check for function expression first
  const funcMatch = expr.match(FUNCTION_EXPR_REGEX);
  if (funcMatch) {
    const [, func, field] = funcMatch;

    if (!isValidFunction(func)) {
      throw new Error(
        `Unknown function: "${func}". Allowed functions: ${Array.from(VALID_FUNCTIONS).join(", ")}`,
      );
    }

    sanitizeFieldName(field);

    return {
      type: "function",
      function: func,
      field,
    };
  }

  // Check for qualified field (collection.field)
  const qualifiedMatch = parseQualifiedField(expr);
  if (qualifiedMatch) {
    return {
      type: "qualified",
      collection: qualifiedMatch.collection,
      field: qualifiedMatch.field,
    };
  }

  // Simple field expression
  sanitizeFieldName(expr);

  return {
    type: "simple",
    field: expr,
  };
}

/**
 * Converts a FieldExpression to a SQL expression string.
 *
 * @param expr - The parsed field expression
 * @param tableAlias - The table alias to use for non-qualified fields (default: "r")
 * @param getJoinAlias - Function to get table alias for a joined collection
 */
export function toSqlExpression(
  expr: FieldExpression,
  tableAlias: string = "r",
  getJoinAlias?: (collection: string) => string,
): string {
  if (expr.type === "function" && expr.function) {
    // Function expressions use the provided table alias
    return FIELD_FUNCTION_SQL[expr.function](expr.field, tableAlias);
  }

  if (expr.type === "qualified" && expr.collection) {
    // Qualified field: use join alias
    const joinAlias = getJoinAlias
      ? getJoinAlias(expr.collection)
      : `j_${expr.collection}`;
    return `${joinAlias}.data->>'${expr.field}'`;
  }

  // Simple field: table.data->>'fieldname'
  return `${tableAlias}.data->>'${expr.field}'`;
}

/**
 * Generates a safe SQL alias from a field expression.
 * Converts:
 * - "month(date)" to "month_date"
 * - "category" to "category"
 * - "accounts.type" to "accounts_type"
 */
export function toSqlAlias(expr: string): string {
  return expr.replace(/[().]/g, "_").replace(/_$/, "").toLowerCase();
}
