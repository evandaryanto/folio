/**
 * Filter operators for composition queries
 */
export enum FilterOperator {
  Eq = "eq",
  Neq = "neq",
  Gt = "gt",
  Gte = "gte",
  Lt = "lt",
  Lte = "lte",
  Contains = "contains",
  In = "in",
}

/**
 * Join types for composition queries
 */
export enum JoinType {
  Inner = "inner",
  Left = "left",
  Right = "right",
}

/**
 * Aggregate functions for composition queries
 */
export enum AggregateFunction {
  Count = "count",
  Sum = "sum",
  Avg = "avg",
  Min = "min",
  Max = "max",
}

/**
 * Sort directions for composition queries
 */
export enum SortDirection {
  Asc = "asc",
  Desc = "desc",
}
