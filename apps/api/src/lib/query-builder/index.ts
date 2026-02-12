import type { CompositionConfig, QueryBuildContext, BuiltQuery } from "./types";
import {
  parseFieldExpression,
  toSqlExpression,
  toSqlAlias,
  sanitizeFieldName,
} from "./field-parser";
import { FilterOperator, AggregateFunction } from "@folio/contract/enums";

export * from "./types";
export * from "./field-parser";

/**
 * QueryBuilder transforms a CompositionConfig into a parameterized SQL query.
 *
 * All values are parameterized ($1, $2, etc.) to prevent SQL injection.
 * Field names are validated to only allow safe characters.
 */
export class QueryBuilder {
  private config: CompositionConfig;
  private context: QueryBuildContext;
  private paramCounter: number = 0;
  private values: unknown[] = [];

  constructor(config: CompositionConfig, context: QueryBuildContext) {
    this.config = config;
    this.context = context;
  }

  /**
   * Gets the table alias for a joined collection.
   */
  private getJoinAlias = (collection: string): string => {
    return `j_${toSqlAlias(collection)}`;
  };

  /**
   * Builds the complete SQL query with parameterized values.
   */
  build(): BuiltQuery {
    const selectClause = this.buildSelect();
    const fromClause = this.buildFrom();
    const joinClause = this.buildJoins();
    const whereClause = this.buildWhere();
    const groupByClause = this.buildGroupBy();
    const orderByClause = this.buildOrderBy();
    const limitClause = this.buildLimit();

    const sql = [
      selectClause,
      fromClause,
      joinClause,
      whereClause,
      groupByClause,
      orderByClause,
      limitClause,
    ]
      .filter(Boolean)
      .join("\n");

    return { sql, values: this.values };
  }

  /**
   * Adds a value to the parameter list and returns its placeholder ($1, $2, etc.)
   */
  private addParam(value: unknown): string {
    this.paramCounter++;
    this.values.push(value);
    return `$${this.paramCounter}`;
  }

  /**
   * Builds the SELECT clause.
   */
  private buildSelect(): string {
    const parts: string[] = [];

    // Handle explicit select fields
    if (this.config.select?.length) {
      for (const field of this.config.select) {
        const expr = parseFieldExpression(field);
        const sql = toSqlExpression(expr, "r", this.getJoinAlias);
        const alias = toSqlAlias(field);
        parts.push(`${sql} AS ${alias}`);
      }
    }

    // Handle groupBy fields (auto-select when aggregating)
    if (this.config.groupBy?.length) {
      for (const field of this.config.groupBy) {
        const expr = parseFieldExpression(field);
        const sql = toSqlExpression(expr, "r", this.getJoinAlias);
        const alias = toSqlAlias(field);
        parts.push(`${sql} AS ${alias}`);
      }
    }

    // Handle aggregations
    if (this.config.aggregations?.length) {
      for (const agg of this.config.aggregations) {
        const aggSql = this.buildAggregation(
          agg.field,
          agg.function as AggregateFunction,
        );
        const alias = toSqlAlias(agg.alias);
        parts.push(`${aggSql} AS ${alias}`);
      }
    }

    // Default: select all data if nothing specified
    if (parts.length === 0) {
      parts.push("r.id", "r.data", "r.created_at", "r.updated_at");
    }

    return `SELECT\n  ${parts.join(",\n  ")}`;
  }

  /**
   * Builds an aggregation expression.
   */
  private buildAggregation(field: string, func: AggregateFunction): string {
    if (func === AggregateFunction.Count) {
      if (field === "*") {
        return "COUNT(*)";
      }
      sanitizeFieldName(field);
      return `COUNT(r.data->>'${field}')`;
    }

    // SUM, AVG, MIN, MAX need numeric casting
    sanitizeFieldName(field);
    const funcUpper = func.toUpperCase();
    return `${funcUpper}((r.data->>'${field}')::numeric)`;
  }

  /**
   * Builds the FROM clause.
   */
  private buildFrom(): string {
    return "FROM records r";
  }

  /**
   * Builds JOIN clauses for related collections.
   */
  private buildJoins(): string {
    if (!this.config.joins?.length) {
      return "";
    }

    const joinClauses: string[] = [];

    for (const join of this.config.joins) {
      const joinCollectionId = this.context.joinCollectionIds.get(
        join.collection,
      );
      if (!joinCollectionId) {
        throw new Error(`Join collection not found: ${join.collection}`);
      }

      const joinType = join.type.toUpperCase();
      const alias = `j_${toSqlAlias(join.collection)}`;

      // Validate join field names
      sanitizeFieldName(join.on.left);
      sanitizeFieldName(join.on.right);

      const onLeft = `r.data->>'${join.on.left}'`;
      const onRight = `${alias}.data->>'${join.on.right}'`;

      // Join condition: both must be in same workspace and match collection
      const workspaceParam = this.addParam(this.context.workspaceId);
      const collectionParam = this.addParam(joinCollectionId);

      joinClauses.push(
        `${joinType} JOIN records ${alias} ON ${alias}.workspace_id = ${workspaceParam} AND ${alias}.collection_id = ${collectionParam} AND ${onLeft} = ${onRight}`,
      );
    }

    return joinClauses.join("\n");
  }

  /**
   * Builds the WHERE clause.
   */
  private buildWhere(): string {
    const conditions: string[] = [
      `r.workspace_id = ${this.addParam(this.context.workspaceId)}`,
      `r.collection_id = ${this.addParam(this.context.fromCollectionId)}`,
    ];

    if (this.config.filters?.length) {
      for (const filter of this.config.filters) {
        const filterSql = this.buildFilter({
          ...filter,
          operator: filter.operator as FilterOperator,
        });
        if (filterSql) {
          conditions.push(filterSql);
        }
      }
    }

    return `WHERE ${conditions.join("\n  AND ")}`;
  }

  /**
   * Builds a single filter condition.
   */
  private buildFilter(filter: {
    field: string;
    operator: FilterOperator;
    value?: unknown;
    param?: string;
  }): string | null {
    sanitizeFieldName(filter.field);
    const fieldExpr = `r.data->>'${filter.field}'`;

    // Get value: either static or from params
    let value: unknown;
    if (filter.param !== undefined) {
      value = this.context.params[filter.param];
      if (value === undefined) {
        // Parameterized filter with no value provided - skip this filter
        return null;
      }
    } else {
      value = filter.value;
    }

    switch (filter.operator) {
      case FilterOperator.Eq:
        return `${fieldExpr} = ${this.addParam(String(value))}`;
      case FilterOperator.Neq:
        return `${fieldExpr} != ${this.addParam(String(value))}`;
      case FilterOperator.Gt:
        return `(${fieldExpr})::numeric > ${this.addParam(Number(value))}`;
      case FilterOperator.Gte:
        return `(${fieldExpr})::numeric >= ${this.addParam(Number(value))}`;
      case FilterOperator.Lt:
        return `(${fieldExpr})::numeric < ${this.addParam(Number(value))}`;
      case FilterOperator.Lte:
        return `(${fieldExpr})::numeric <= ${this.addParam(Number(value))}`;
      case FilterOperator.Contains:
        return `${fieldExpr} ILIKE ${this.addParam(`%${String(value)}%`)}`;
      case FilterOperator.In: {
        if (!Array.isArray(value)) {
          throw new Error("'in' operator requires array value");
        }
        const placeholders = value
          .map((v) => this.addParam(String(v)))
          .join(", ");
        return `${fieldExpr} IN (${placeholders})`;
      }
      default:
        throw new Error(`Unknown operator: ${filter.operator}`);
    }
  }

  /**
   * Builds the GROUP BY clause.
   */
  private buildGroupBy(): string {
    if (!this.config.groupBy?.length) {
      return "";
    }

    const parts = this.config.groupBy.map((field) => {
      const expr = parseFieldExpression(field);
      return toSqlExpression(expr, "r", this.getJoinAlias);
    });

    return `GROUP BY ${parts.join(", ")}`;
  }

  /**
   * Builds the ORDER BY clause.
   */
  private buildOrderBy(): string {
    if (!this.config.sort?.length) {
      return "";
    }

    const parts = this.config.sort.map((sort) => {
      const direction = sort.direction.toUpperCase();

      // Check if sorting by a groupBy alias
      if (this.config.groupBy?.includes(sort.field)) {
        const alias = toSqlAlias(sort.field);
        return `${alias} ${direction}`;
      }

      // Check if sorting by an aggregation alias
      const aggMatch = this.config.aggregations?.find(
        (a) => a.alias === sort.field,
      );
      if (aggMatch) {
        const alias = toSqlAlias(aggMatch.alias);
        return `${alias} ${direction}`;
      }

      // Otherwise, parse as field expression
      const expr = parseFieldExpression(sort.field);
      return `${toSqlExpression(expr, "r", this.getJoinAlias)} ${direction}`;
    });

    return `ORDER BY ${parts.join(", ")}`;
  }

  /**
   * Builds the LIMIT clause.
   */
  private buildLimit(): string {
    if (!this.config.limit) {
      return "";
    }
    return `LIMIT ${this.addParam(this.config.limit)}`;
  }
}
