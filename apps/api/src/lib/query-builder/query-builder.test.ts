import { QueryBuilder } from "./index";
import {
  sanitizeFieldName,
  parseFieldExpression,
  toSqlExpression,
  toSqlAlias,
} from "./field-parser";
import type { CompositionConfig, QueryBuildContext } from "./types";

describe("field-parser", () => {
  describe("sanitizeFieldName", () => {
    it("should accept valid field names", () => {
      expect(sanitizeFieldName("category")).toBe("category");
      expect(sanitizeFieldName("user_name")).toBe("user_name");
      expect(sanitizeFieldName("_private")).toBe("_private");
      expect(sanitizeFieldName("field123")).toBe("field123");
      expect(sanitizeFieldName("CamelCase")).toBe("CamelCase");
    });

    it("should reject field names starting with numbers", () => {
      expect(() => sanitizeFieldName("123field")).toThrow("Invalid field name");
    });

    it("should reject field names with special characters", () => {
      expect(() => sanitizeFieldName("field-name")).toThrow(
        "Invalid field name",
      );
      expect(() => sanitizeFieldName("field.name")).toThrow(
        "Invalid field name",
      );
      expect(() => sanitizeFieldName("field name")).toThrow(
        "Invalid field name",
      );
      expect(() => sanitizeFieldName("field@name")).toThrow(
        "Invalid field name",
      );
    });

    it("should reject SQL injection attempts", () => {
      expect(() => sanitizeFieldName("field'; DROP TABLE users; --")).toThrow(
        "Invalid field name",
      );
      expect(() => sanitizeFieldName("field' OR '1'='1")).toThrow(
        "Invalid field name",
      );
      expect(() => sanitizeFieldName("field--comment")).toThrow(
        "Invalid field name",
      );
    });

    it("should reject empty field names", () => {
      expect(() => sanitizeFieldName("")).toThrow("Invalid field name");
    });
  });

  describe("parseFieldExpression", () => {
    describe("simple fields", () => {
      it("should parse simple field names", () => {
        const result = parseFieldExpression("category");
        expect(result).toEqual({ type: "simple", field: "category" });
      });

      it("should parse field names with underscores", () => {
        const result = parseFieldExpression("user_name");
        expect(result).toEqual({ type: "simple", field: "user_name" });
      });
    });

    describe("function expressions", () => {
      it("should parse month function", () => {
        const result = parseFieldExpression("month(date)");
        expect(result).toEqual({
          type: "function",
          function: "month",
          field: "date",
        });
      });

      it("should parse year function", () => {
        const result = parseFieldExpression("year(created_at)");
        expect(result).toEqual({
          type: "function",
          function: "year",
          field: "created_at",
        });
      });

      it("should parse day function", () => {
        const result = parseFieldExpression("day(timestamp)");
        expect(result).toEqual({
          type: "function",
          function: "day",
          field: "timestamp",
        });
      });

      it("should parse date function", () => {
        const result = parseFieldExpression("date(created_at)");
        expect(result).toEqual({
          type: "function",
          function: "date",
          field: "created_at",
        });
      });
    });

    describe("error cases", () => {
      it("should throw for unknown functions", () => {
        expect(() => parseFieldExpression("unknown(field)")).toThrow(
          "Unknown function",
        );
      });

      it("should throw for invalid field names in functions", () => {
        expect(() => parseFieldExpression("month(123invalid)")).toThrow(
          "Invalid field name",
        );
      });

      it("should throw for invalid simple field names", () => {
        expect(() => parseFieldExpression("invalid-field")).toThrow(
          "Invalid field name",
        );
      });
    });
  });

  describe("toSqlExpression", () => {
    it("should convert simple field to SQL", () => {
      const expr = parseFieldExpression("category");
      expect(toSqlExpression(expr)).toBe("r.data->>'category'");
    });

    it("should convert simple field with custom alias", () => {
      const expr = parseFieldExpression("category");
      expect(toSqlExpression(expr, "t")).toBe("t.data->>'category'");
    });

    it("should convert month function to SQL", () => {
      const expr = parseFieldExpression("month(date)");
      expect(toSqlExpression(expr)).toBe(
        "to_char((data->>'date')::date, 'YYYY-MM')",
      );
    });

    it("should convert year function to SQL", () => {
      const expr = parseFieldExpression("year(date)");
      expect(toSqlExpression(expr)).toBe(
        "to_char((data->>'date')::date, 'YYYY')",
      );
    });

    it("should convert day function to SQL", () => {
      const expr = parseFieldExpression("day(date)");
      expect(toSqlExpression(expr)).toBe(
        "to_char((data->>'date')::date, 'YYYY-MM-DD')",
      );
    });

    it("should convert date function to SQL", () => {
      const expr = parseFieldExpression("date(created_at)");
      expect(toSqlExpression(expr)).toBe("(data->>'created_at')::date");
    });
  });

  describe("toSqlAlias", () => {
    it("should convert simple field to alias", () => {
      expect(toSqlAlias("category")).toBe("category");
    });

    it("should convert function expression to alias", () => {
      expect(toSqlAlias("month(date)")).toBe("month_date");
    });

    it("should convert to lowercase", () => {
      expect(toSqlAlias("CamelCase")).toBe("camelcase");
    });

    it("should handle multiple parentheses", () => {
      expect(toSqlAlias("year(created_at)")).toBe("year_created_at");
    });
  });
});

describe("QueryBuilder", () => {
  const baseContext: QueryBuildContext = {
    workspaceId: "ws-123",
    fromCollectionId: "col-456",
    joinCollectionIds: new Map(),
    params: {},
  };

  describe("basic queries", () => {
    it("should build a minimal query with default SELECT", () => {
      const config: CompositionConfig = {
        from: "expenses",
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql, values } = builder.build();

      expect(sql).toContain("SELECT");
      expect(sql).toContain("r.id");
      expect(sql).toContain("r.data");
      expect(sql).toContain("r.created_at");
      expect(sql).toContain("r.updated_at");
      expect(sql).toContain("FROM records r");
      expect(sql).toContain("WHERE r.workspace_id = $1");
      expect(sql).toContain("AND r.collection_id = $2");
      expect(values).toEqual(["ws-123", "col-456"]);
    });
  });

  describe("SELECT clause", () => {
    it("should build SELECT with explicit fields", () => {
      const config: CompositionConfig = {
        from: "expenses",
        select: ["category", "amount"],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain("r.data->>'category' AS category");
      expect(sql).toContain("r.data->>'amount' AS amount");
    });

    it("should build SELECT with function fields", () => {
      const config: CompositionConfig = {
        from: "expenses",
        select: ["month(date)", "category"],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain(
        "to_char((data->>'date')::date, 'YYYY-MM') AS month_date",
      );
      expect(sql).toContain("r.data->>'category' AS category");
    });

    it("should build SELECT with groupBy fields", () => {
      const config: CompositionConfig = {
        from: "expenses",
        groupBy: ["category", "month(date)"],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain("r.data->>'category' AS category");
      expect(sql).toContain(
        "to_char((data->>'date')::date, 'YYYY-MM') AS month_date",
      );
    });

    it("should build SELECT with aggregations", () => {
      const config: CompositionConfig = {
        from: "expenses",
        aggregations: [
          { field: "amount", function: "sum", alias: "total" },
          { field: "*", function: "count", alias: "count" },
        ],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain("SUM((r.data->>'amount')::numeric) AS total");
      expect(sql).toContain("COUNT(*) AS count");
    });

    it("should build SELECT with all aggregate functions", () => {
      const config: CompositionConfig = {
        from: "expenses",
        aggregations: [
          { field: "amount", function: "sum", alias: "sum_amount" },
          { field: "amount", function: "avg", alias: "avg_amount" },
          { field: "amount", function: "min", alias: "min_amount" },
          { field: "amount", function: "max", alias: "max_amount" },
          { field: "id", function: "count", alias: "count_id" },
        ],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain("SUM((r.data->>'amount')::numeric) AS sum_amount");
      expect(sql).toContain("AVG((r.data->>'amount')::numeric) AS avg_amount");
      expect(sql).toContain("MIN((r.data->>'amount')::numeric) AS min_amount");
      expect(sql).toContain("MAX((r.data->>'amount')::numeric) AS max_amount");
      expect(sql).toContain("COUNT(r.data->>'id') AS count_id");
    });
  });

  describe("WHERE clause with filters", () => {
    describe("equality operators", () => {
      it("should build eq filter", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [{ field: "status", operator: "eq", value: "active" }],
        };

        const builder = new QueryBuilder(config, baseContext);
        const { sql, values } = builder.build();

        expect(sql).toContain("r.data->>'status' = $3");
        expect(values[2]).toBe("active");
      });

      it("should build neq filter", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [{ field: "status", operator: "neq", value: "deleted" }],
        };

        const builder = new QueryBuilder(config, baseContext);
        const { sql, values } = builder.build();

        expect(sql).toContain("r.data->>'status' != $3");
        expect(values[2]).toBe("deleted");
      });
    });

    describe("comparison operators", () => {
      it("should build gt filter with numeric casting", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [{ field: "amount", operator: "gt", value: 100 }],
        };

        const builder = new QueryBuilder(config, baseContext);
        const { sql, values } = builder.build();

        expect(sql).toContain("(r.data->>'amount')::numeric > $3");
        expect(values[2]).toBe(100);
      });

      it("should build gte filter", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [{ field: "amount", operator: "gte", value: 50 }],
        };

        const builder = new QueryBuilder(config, baseContext);
        const { sql, values } = builder.build();

        expect(sql).toContain("(r.data->>'amount')::numeric >= $3");
        expect(values[2]).toBe(50);
      });

      it("should build lt filter", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [{ field: "amount", operator: "lt", value: 1000 }],
        };

        const builder = new QueryBuilder(config, baseContext);
        const { sql, values } = builder.build();

        expect(sql).toContain("(r.data->>'amount')::numeric < $3");
        expect(values[2]).toBe(1000);
      });

      it("should build lte filter", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [{ field: "amount", operator: "lte", value: 500 }],
        };

        const builder = new QueryBuilder(config, baseContext);
        const { sql, values } = builder.build();

        expect(sql).toContain("(r.data->>'amount')::numeric <= $3");
        expect(values[2]).toBe(500);
      });
    });

    describe("string operators", () => {
      it("should build contains filter with ILIKE", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [
            { field: "description", operator: "contains", value: "food" },
          ],
        };

        const builder = new QueryBuilder(config, baseContext);
        const { sql, values } = builder.build();

        expect(sql).toContain("r.data->>'description' ILIKE $3");
        expect(values[2]).toBe("%food%");
      });
    });

    describe("array operators", () => {
      it("should build in filter with array values", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [
            {
              field: "category",
              operator: "in",
              value: ["food", "transport", "utilities"],
            },
          ],
        };

        const builder = new QueryBuilder(config, baseContext);
        const { sql, values } = builder.build();

        expect(sql).toContain("r.data->>'category' IN ($3, $4, $5)");
        expect(values[2]).toBe("food");
        expect(values[3]).toBe("transport");
        expect(values[4]).toBe("utilities");
      });

      it("should throw for in filter with non-array value", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [
            { field: "category", operator: "in", value: "not-an-array" },
          ],
        };

        const builder = new QueryBuilder(config, baseContext);
        expect(() => builder.build()).toThrow(
          "'in' operator requires array value",
        );
      });
    });

    describe("parameterized filters", () => {
      it("should use param value from context", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [
            { field: "category", operator: "eq", param: "categoryFilter" },
          ],
        };

        const context: QueryBuildContext = {
          ...baseContext,
          params: { categoryFilter: "food" },
        };

        const builder = new QueryBuilder(config, context);
        const { sql, values } = builder.build();

        expect(sql).toContain("r.data->>'category' = $3");
        expect(values[2]).toBe("food");
      });

      it("should skip filter when param value is not provided", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [
            { field: "category", operator: "eq", param: "missingParam" },
          ],
        };

        const builder = new QueryBuilder(config, baseContext);
        const { sql, values } = builder.build();

        expect(sql).not.toContain("r.data->>'category'");
        expect(values.length).toBe(2); // Only workspace and collection
      });
    });

    describe("multiple filters", () => {
      it("should combine multiple filters with AND", () => {
        const config: CompositionConfig = {
          from: "expenses",
          filters: [
            { field: "status", operator: "eq", value: "active" },
            { field: "amount", operator: "gt", value: 100 },
          ],
        };

        const builder = new QueryBuilder(config, baseContext);
        const { sql, values } = builder.build();

        expect(sql).toContain("r.data->>'status' = $3");
        expect(sql).toContain("AND (r.data->>'amount')::numeric > $4");
        expect(values).toEqual(["ws-123", "col-456", "active", 100]);
      });
    });
  });

  describe("JOIN clause", () => {
    it("should build INNER JOIN", () => {
      const config: CompositionConfig = {
        from: "expenses",
        joins: [
          {
            collection: "categories",
            on: { left: "category_id", right: "id" },
            type: "inner",
          },
        ],
      };

      const context: QueryBuildContext = {
        ...baseContext,
        joinCollectionIds: new Map([["categories", "cat-789"]]),
      };

      const builder = new QueryBuilder(config, context);
      const { sql, values } = builder.build();

      expect(sql).toContain("INNER JOIN records j_categories");
      // JOIN params come first ($1, $2), then WHERE params ($3, $4)
      expect(sql).toContain("j_categories.workspace_id = $1");
      expect(sql).toContain("j_categories.collection_id = $2");
      expect(sql).toContain(
        "r.data->>'category_id' = j_categories.data->>'id'",
      );
      expect(values[0]).toBe("ws-123");
      expect(values[1]).toBe("cat-789");
      expect(values[2]).toBe("ws-123"); // WHERE workspace
      expect(values[3]).toBe("col-456"); // WHERE collection
    });

    it("should build LEFT JOIN", () => {
      const config: CompositionConfig = {
        from: "expenses",
        joins: [
          {
            collection: "users",
            on: { left: "user_id", right: "id" },
            type: "left",
          },
        ],
      };

      const context: QueryBuildContext = {
        ...baseContext,
        joinCollectionIds: new Map([["users", "usr-123"]]),
      };

      const builder = new QueryBuilder(config, context);
      const { sql } = builder.build();

      expect(sql).toContain("LEFT JOIN records j_users");
    });

    it("should build RIGHT JOIN", () => {
      const config: CompositionConfig = {
        from: "expenses",
        joins: [
          {
            collection: "departments",
            on: { left: "dept_id", right: "id" },
            type: "right",
          },
        ],
      };

      const context: QueryBuildContext = {
        ...baseContext,
        joinCollectionIds: new Map([["departments", "dept-456"]]),
      };

      const builder = new QueryBuilder(config, context);
      const { sql } = builder.build();

      expect(sql).toContain("RIGHT JOIN records j_departments");
    });

    it("should throw for unknown join collection", () => {
      const config: CompositionConfig = {
        from: "expenses",
        joins: [
          {
            collection: "unknown",
            on: { left: "id", right: "id" },
            type: "inner",
          },
        ],
      };

      const builder = new QueryBuilder(config, baseContext);
      expect(() => builder.build()).toThrow(
        "Join collection not found: unknown",
      );
    });
  });

  describe("GROUP BY clause", () => {
    it("should build GROUP BY with simple fields", () => {
      const config: CompositionConfig = {
        from: "expenses",
        groupBy: ["category"],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain("GROUP BY r.data->>'category'");
    });

    it("should build GROUP BY with function fields", () => {
      const config: CompositionConfig = {
        from: "expenses",
        groupBy: ["month(date)"],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain(
        "GROUP BY to_char((data->>'date')::date, 'YYYY-MM')",
      );
    });

    it("should build GROUP BY with multiple fields", () => {
      const config: CompositionConfig = {
        from: "expenses",
        groupBy: ["category", "month(date)"],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain("GROUP BY r.data->>'category'");
      expect(sql).toContain("to_char((data->>'date')::date, 'YYYY-MM')");
    });
  });

  describe("ORDER BY clause", () => {
    it("should build ORDER BY with simple field", () => {
      const config: CompositionConfig = {
        from: "expenses",
        sort: [{ field: "amount", direction: "desc" }],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain("ORDER BY r.data->>'amount' DESC");
    });

    it("should build ORDER BY with ASC direction", () => {
      const config: CompositionConfig = {
        from: "expenses",
        sort: [{ field: "created_at", direction: "asc" }],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain("ORDER BY r.data->>'created_at' ASC");
    });

    it("should build ORDER BY using groupBy alias", () => {
      const config: CompositionConfig = {
        from: "expenses",
        groupBy: ["month(date)"],
        sort: [{ field: "month(date)", direction: "desc" }],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain("ORDER BY month_date DESC");
    });

    it("should build ORDER BY using aggregation alias", () => {
      const config: CompositionConfig = {
        from: "expenses",
        groupBy: ["category"],
        aggregations: [{ field: "amount", function: "sum", alias: "total" }],
        sort: [{ field: "total", direction: "desc" }],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain("ORDER BY total DESC");
    });

    it("should build ORDER BY with multiple fields", () => {
      const config: CompositionConfig = {
        from: "expenses",
        sort: [
          { field: "category", direction: "asc" },
          { field: "amount", direction: "desc" },
        ],
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).toContain(
        "ORDER BY r.data->>'category' ASC, r.data->>'amount' DESC",
      );
    });
  });

  describe("LIMIT clause", () => {
    it("should build LIMIT clause", () => {
      const config: CompositionConfig = {
        from: "expenses",
        limit: 10,
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql, values } = builder.build();

      expect(sql).toContain("LIMIT $3");
      expect(values[2]).toBe(10);
    });

    it("should not include LIMIT when not specified", () => {
      const config: CompositionConfig = {
        from: "expenses",
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql } = builder.build();

      expect(sql).not.toContain("LIMIT");
    });
  });

  describe("complete query scenarios", () => {
    it("should build a complex aggregation query", () => {
      const config: CompositionConfig = {
        from: "expenses",
        groupBy: ["category", "month(date)"],
        aggregations: [
          { field: "amount", function: "sum", alias: "total" },
          { field: "*", function: "count", alias: "count" },
        ],
        filters: [{ field: "status", operator: "eq", value: "approved" }],
        sort: [
          { field: "month(date)", direction: "desc" },
          { field: "total", direction: "desc" },
        ],
        limit: 100,
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql, values } = builder.build();

      // Verify all parts are present
      expect(sql).toContain("SELECT");
      expect(sql).toContain("FROM records r");
      expect(sql).toContain("WHERE");
      expect(sql).toContain("GROUP BY");
      expect(sql).toContain("ORDER BY");
      expect(sql).toContain("LIMIT");

      // Verify parameterization
      expect(values.length).toBe(4); // workspace, collection, status filter, limit
      expect(values[0]).toBe("ws-123");
      expect(values[1]).toBe("col-456");
      expect(values[2]).toBe("approved");
      expect(values[3]).toBe(100);
    });

    it("should build a query with joins and filters", () => {
      const config: CompositionConfig = {
        from: "orders",
        select: ["order_id", "customer_name"],
        joins: [
          {
            collection: "customers",
            on: { left: "customer_id", right: "id" },
            type: "inner",
          },
        ],
        filters: [
          { field: "status", operator: "eq", value: "completed" },
          { field: "amount", operator: "gte", value: 100 },
        ],
        sort: [{ field: "order_id", direction: "asc" }],
      };

      const context: QueryBuildContext = {
        ...baseContext,
        joinCollectionIds: new Map([["customers", "cust-123"]]),
      };

      const builder = new QueryBuilder(config, context);
      const { sql, values } = builder.build();

      expect(sql).toContain("SELECT");
      expect(sql).toContain("INNER JOIN records j_customers");
      expect(sql).toContain("WHERE");
      expect(sql).toContain("ORDER BY");

      // Values: workspace (WHERE), collection (WHERE), workspace (JOIN), collection (JOIN), filter1, filter2
      expect(values.length).toBe(6);
    });
  });

  describe("SQL injection prevention", () => {
    it("should reject malicious field names in select", () => {
      const config: CompositionConfig = {
        from: "expenses",
        select: ["field'; DROP TABLE records; --"],
      };

      const builder = new QueryBuilder(config, baseContext);
      expect(() => builder.build()).toThrow("Invalid field name");
    });

    it("should reject malicious field names in filters", () => {
      const config: CompositionConfig = {
        from: "expenses",
        filters: [
          { field: "status' OR '1'='1", operator: "eq", value: "active" },
        ],
      };

      const builder = new QueryBuilder(config, baseContext);
      expect(() => builder.build()).toThrow("Invalid field name");
    });

    it("should reject malicious field names in groupBy", () => {
      const config: CompositionConfig = {
        from: "expenses",
        groupBy: ["category; DELETE FROM records"],
      };

      const builder = new QueryBuilder(config, baseContext);
      expect(() => builder.build()).toThrow("Invalid field name");
    });

    it("should reject malicious field names in joins", () => {
      const config: CompositionConfig = {
        from: "expenses",
        joins: [
          {
            collection: "categories",
            on: { left: "id'; --", right: "category_id" },
            type: "inner",
          },
        ],
      };

      const context: QueryBuildContext = {
        ...baseContext,
        joinCollectionIds: new Map([["categories", "cat-123"]]),
      };

      const builder = new QueryBuilder(config, context);
      expect(() => builder.build()).toThrow("Invalid field name");
    });

    it("should parameterize all user-provided values", () => {
      const config: CompositionConfig = {
        from: "expenses",
        filters: [
          {
            field: "description",
            operator: "contains",
            value: "'; DROP TABLE",
          },
        ],
        limit: 10,
      };

      const builder = new QueryBuilder(config, baseContext);
      const { sql, values } = builder.build();

      // Malicious value should be in parameterized values, not in SQL
      expect(sql).not.toContain("DROP TABLE");
      expect(values).toContain("%'; DROP TABLE%");
    });
  });
});
