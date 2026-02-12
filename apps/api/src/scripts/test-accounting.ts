/* eslint-disable no-console */
/**
 * Test script for accounting business use case (using Service layer)
 *
 * Usage: bun run src/scripts/test-accounting.ts
 *
 * Simulates an accounting system with:
 * - Accounts (bank accounts, cash, etc.)
 * - Transactions (cashflow entries)
 * - Revenue (income by category)
 * - Expenses (costs by category)
 *
 * Creates compositions for:
 * - Monthly cashflow summary
 * - Revenue by category
 * - Expenses by category
 * - Profit/Loss overview
 */

import { Container } from "@/bootstrap/container";
import {
  AccessLevel,
  AggregateFunction,
  SortDirection,
  FieldType,
} from "@folio/contract/enums";

const TEST_USER = {
  email: `accounting.user@example.com`,
  password: "password123",
  name: "Accounting Admin",
  workspaceName: "Acme Corp Accounting",
  workspaceSlug: `acme-accounting-user`,
};

// Sample data for realistic accounting scenarios
const ACCOUNTS = [
  { name: "Main Bank Account", type: "bank", currency: "USD", balance: 50000 },
  { name: "Petty Cash", type: "cash", currency: "USD", balance: 1000 },
  { name: "Savings Account", type: "bank", currency: "USD", balance: 25000 },
];

const REVENUE_ENTRIES = [
  {
    description: "Product Sales - Q1",
    category: "sales",
    amount: 45000,
    date: "2024-01-15",
    client: "Various",
  },
  {
    description: "Consulting Services",
    category: "services",
    amount: 15000,
    date: "2024-01-20",
    client: "TechCorp Inc",
  },
  {
    description: "Product Sales - Q1",
    category: "sales",
    amount: 52000,
    date: "2024-02-10",
    client: "Various",
  },
  {
    description: "Training Workshop",
    category: "services",
    amount: 8000,
    date: "2024-02-15",
    client: "StartupXYZ",
  },
  {
    description: "License Fees",
    category: "licensing",
    amount: 12000,
    date: "2024-02-28",
    client: "Enterprise Co",
  },
  {
    description: "Product Sales - Q1",
    category: "sales",
    amount: 48000,
    date: "2024-03-05",
    client: "Various",
  },
  {
    description: "Consulting Services",
    category: "services",
    amount: 20000,
    date: "2024-03-15",
    client: "BigBank Ltd",
  },
];

const EXPENSE_ENTRIES = [
  {
    description: "Office Rent",
    category: "rent",
    amount: 5000,
    date: "2024-01-01",
    vendor: "Building Corp",
  },
  {
    description: "Employee Salaries",
    category: "salaries",
    amount: 35000,
    date: "2024-01-31",
    vendor: "Payroll",
  },
  {
    description: "Software Subscriptions",
    category: "software",
    amount: 2500,
    date: "2024-01-15",
    vendor: "Various SaaS",
  },
  {
    description: "Office Rent",
    category: "rent",
    amount: 5000,
    date: "2024-02-01",
    vendor: "Building Corp",
  },
  {
    description: "Employee Salaries",
    category: "salaries",
    amount: 35000,
    date: "2024-02-28",
    vendor: "Payroll",
  },
  {
    description: "Marketing Campaign",
    category: "marketing",
    amount: 8000,
    date: "2024-02-10",
    vendor: "AdAgency",
  },
  {
    description: "Equipment Purchase",
    category: "equipment",
    amount: 15000,
    date: "2024-02-20",
    vendor: "TechSupply",
  },
  {
    description: "Office Rent",
    category: "rent",
    amount: 5000,
    date: "2024-03-01",
    vendor: "Building Corp",
  },
  {
    description: "Employee Salaries",
    category: "salaries",
    amount: 36000,
    date: "2024-03-31",
    vendor: "Payroll",
  },
  {
    description: "Travel Expenses",
    category: "travel",
    amount: 4500,
    date: "2024-03-15",
    vendor: "Various",
  },
];

const TRANSACTIONS = [
  {
    description: "Initial Capital",
    type: "income",
    amount: 100000,
    date: "2024-01-01",
    account: "Main Bank Account",
  },
  {
    description: "Client Payment - TechCorp",
    type: "income",
    amount: 15000,
    date: "2024-01-22",
    account: "Main Bank Account",
  },
  {
    description: "Rent Payment",
    type: "expense",
    amount: 5000,
    date: "2024-01-05",
    account: "Main Bank Account",
  },
  {
    description: "Payroll",
    type: "expense",
    amount: 35000,
    date: "2024-01-31",
    account: "Main Bank Account",
  },
  {
    description: "Client Payment - Various",
    type: "income",
    amount: 45000,
    date: "2024-02-05",
    account: "Main Bank Account",
  },
  {
    description: "Equipment Purchase",
    type: "expense",
    amount: 15000,
    date: "2024-02-20",
    account: "Main Bank Account",
  },
  {
    description: "Transfer to Savings",
    type: "transfer",
    amount: 25000,
    date: "2024-02-25",
    account: "Savings Account",
  },
];

async function main() {
  console.log("=".repeat(60));
  console.log("Accounting Business Test Script");
  console.log("=".repeat(60));

  const container = Container.getInstance();
  const services = container.getServices();

  // ========== SETUP: Register & Create Workspace ==========
  console.log("\n[1] Setting up accounting workspace...");
  const registerResult = await services.auth.register({
    email: TEST_USER.email,
    password: TEST_USER.password,
    name: TEST_USER.name,
    workspaceName: TEST_USER.workspaceName,
    workspaceSlug: TEST_USER.workspaceSlug,
  });

  if (!registerResult.ok) {
    console.error("Register failed:", registerResult.error);
    await container.shutdown();
    process.exit(1);
  }

  const userId = registerResult.data.user.id;
  const workspaceId = registerResult.data.user.workspaceId;
  const workspaceSlug = registerResult.data.user.workspaceSlug;

  console.log("  Workspace:", workspaceSlug);
  console.log("  User:", registerResult.data.user.email);

  // ========== CREATE COLLECTIONS ==========
  console.log("\n[2] Creating collections...");

  // Accounts Collection
  const accountsCollection = await services.collection.createCollection(
    workspaceId,
    {
      slug: "accounts",
      name: "Accounts",
      description: "Bank accounts and cash",
    },
    userId,
  );
  if (!accountsCollection.ok) {
    console.error(
      "Create accounts collection failed:",
      accountsCollection.error,
    );
    await container.shutdown();
    process.exit(1);
  }
  const accountsId = accountsCollection.data.collection.id;
  console.log("  Created: accounts");

  // Revenue Collection
  const revenueCollection = await services.collection.createCollection(
    workspaceId,
    {
      slug: "revenue",
      name: "Revenue",
      description: "Income and sales records",
    },
    userId,
  );
  if (!revenueCollection.ok) {
    console.error("Create revenue collection failed:", revenueCollection.error);
    await container.shutdown();
    process.exit(1);
  }
  const revenueId = revenueCollection.data.collection.id;
  console.log("  Created: revenue");

  // Expenses Collection
  const expensesCollection = await services.collection.createCollection(
    workspaceId,
    { slug: "expenses", name: "Expenses", description: "Business expenses" },
    userId,
  );
  if (!expensesCollection.ok) {
    console.error(
      "Create expenses collection failed:",
      expensesCollection.error,
    );
    await container.shutdown();
    process.exit(1);
  }
  const expensesId = expensesCollection.data.collection.id;
  console.log("  Created: expenses");

  // Transactions Collection (Cashflow)
  const transactionsCollection = await services.collection.createCollection(
    workspaceId,
    {
      slug: "transactions",
      name: "Transactions",
      description: "Cashflow transactions",
    },
    userId,
  );
  if (!transactionsCollection.ok) {
    console.error(
      "Create transactions collection failed:",
      transactionsCollection.error,
    );
    await container.shutdown();
    process.exit(1);
  }
  const transactionsId = transactionsCollection.data.collection.id;
  console.log("  Created: transactions");

  // ========== CREATE FIELDS ==========
  console.log("\n[3] Creating fields for each collection...");

  // Accounts fields
  const accountFields = [
    { slug: "name", name: "Account Name", fieldType: FieldType.Text },
    { slug: "type", name: "Account Type", fieldType: FieldType.Select },
    { slug: "currency", name: "Currency", fieldType: FieldType.Text },
    { slug: "balance", name: "Balance", fieldType: FieldType.Number },
  ];

  for (const field of accountFields) {
    await services.field.createField(workspaceId, accountsId, {
      ...field,
      isRequired: true,
      isUnique: field.slug === "name",
      sortOrder: accountFields.indexOf(field) + 1,
    });
  }
  console.log("  Accounts: 4 fields");

  // Revenue fields
  const revenueFields = [
    { slug: "description", name: "Description", fieldType: FieldType.Text },
    { slug: "category", name: "Category", fieldType: FieldType.Select },
    { slug: "amount", name: "Amount", fieldType: FieldType.Number },
    { slug: "date", name: "Date", fieldType: FieldType.Date },
    { slug: "client", name: "Client", fieldType: FieldType.Text },
  ];

  for (const field of revenueFields) {
    await services.field.createField(workspaceId, revenueId, {
      ...field,
      isRequired: field.slug !== "client",
      isUnique: false,
      sortOrder: revenueFields.indexOf(field) + 1,
    });
  }
  console.log("  Revenue: 5 fields");

  // Expenses fields
  const expenseFields = [
    { slug: "description", name: "Description", fieldType: FieldType.Text },
    { slug: "category", name: "Category", fieldType: FieldType.Select },
    { slug: "amount", name: "Amount", fieldType: FieldType.Number },
    { slug: "date", name: "Date", fieldType: FieldType.Date },
    { slug: "vendor", name: "Vendor", fieldType: FieldType.Text },
  ];

  for (const field of expenseFields) {
    await services.field.createField(workspaceId, expensesId, {
      ...field,
      isRequired: field.slug !== "vendor",
      isUnique: false,
      sortOrder: expenseFields.indexOf(field) + 1,
    });
  }
  console.log("  Expenses: 5 fields");

  // Transactions fields
  const transactionFields = [
    { slug: "description", name: "Description", fieldType: FieldType.Text },
    { slug: "type", name: "Type", fieldType: FieldType.Select },
    { slug: "amount", name: "Amount", fieldType: FieldType.Number },
    { slug: "date", name: "Date", fieldType: FieldType.Date },
    { slug: "account", name: "Account", fieldType: FieldType.Text },
  ];

  for (const field of transactionFields) {
    await services.field.createField(workspaceId, transactionsId, {
      ...field,
      isRequired: true,
      isUnique: false,
      sortOrder: transactionFields.indexOf(field) + 1,
    });
  }
  console.log("  Transactions: 5 fields");

  // ========== ADD SAMPLE DATA ==========
  console.log("\n[4] Adding sample data...");

  // Add accounts
  for (const account of ACCOUNTS) {
    await services.record.createRecord(
      workspaceId,
      accountsId,
      { data: account },
      userId,
    );
  }
  console.log(`  Accounts: ${ACCOUNTS.length} records`);

  // Add revenue
  for (const revenue of REVENUE_ENTRIES) {
    await services.record.createRecord(
      workspaceId,
      revenueId,
      { data: revenue },
      userId,
    );
  }
  console.log(`  Revenue: ${REVENUE_ENTRIES.length} records`);

  // Add expenses
  for (const expense of EXPENSE_ENTRIES) {
    await services.record.createRecord(
      workspaceId,
      expensesId,
      { data: expense },
      userId,
    );
  }
  console.log(`  Expenses: ${EXPENSE_ENTRIES.length} records`);

  // Add transactions
  for (const transaction of TRANSACTIONS) {
    await services.record.createRecord(
      workspaceId,
      transactionsId,
      { data: transaction },
      userId,
    );
  }
  console.log(`  Transactions: ${TRANSACTIONS.length} records`);

  // ========== CREATE COMPOSITIONS (Reports) ==========
  console.log("\n[5] Creating accounting reports (compositions)...");

  // Revenue by Category
  const revenueByCategory = await services.composition.createComposition(
    workspaceId,
    {
      slug: "revenue-by-category",
      name: "Revenue by Category",
      description: "Total revenue grouped by category",
      config: {
        from: "revenue",
        groupBy: ["category"],
        aggregations: [
          { field: "amount", function: AggregateFunction.Sum, alias: "total" },
          {
            field: "amount",
            function: AggregateFunction.Count,
            alias: "count",
          },
        ],
        sort: [{ field: "total", direction: SortDirection.Desc }],
      },
      accessLevel: AccessLevel.Public,
      isActive: true,
    },
    userId,
  );
  if (!revenueByCategory.ok) {
    console.error(
      "Create revenue composition failed:",
      revenueByCategory.error,
    );
    await container.shutdown();
    process.exit(1);
  }
  console.log("  Created: revenue-by-category");

  // Expenses by Category
  const expensesByCategory = await services.composition.createComposition(
    workspaceId,
    {
      slug: "expenses-by-category",
      name: "Expenses by Category",
      description: "Total expenses grouped by category",
      config: {
        from: "expenses",
        groupBy: ["category"],
        aggregations: [
          { field: "amount", function: AggregateFunction.Sum, alias: "total" },
          {
            field: "amount",
            function: AggregateFunction.Count,
            alias: "count",
          },
        ],
        sort: [{ field: "total", direction: SortDirection.Desc }],
      },
      accessLevel: AccessLevel.Public,
      isActive: true,
    },
    userId,
  );
  if (!expensesByCategory.ok) {
    console.error(
      "Create expenses composition failed:",
      expensesByCategory.error,
    );
    await container.shutdown();
    process.exit(1);
  }
  console.log("  Created: expenses-by-category");

  // Cashflow by Type
  const cashflowByType = await services.composition.createComposition(
    workspaceId,
    {
      slug: "cashflow-summary",
      name: "Cashflow Summary",
      description: "Cashflow grouped by transaction type",
      config: {
        from: "transactions",
        groupBy: ["type"],
        aggregations: [
          { field: "amount", function: AggregateFunction.Sum, alias: "total" },
          {
            field: "amount",
            function: AggregateFunction.Count,
            alias: "count",
          },
        ],
        sort: [{ field: "total", direction: SortDirection.Desc }],
      },
      accessLevel: AccessLevel.Public,
      isActive: true,
    },
    userId,
  );
  if (!cashflowByType.ok) {
    console.error("Create cashflow composition failed:", cashflowByType.error);
    await container.shutdown();
    process.exit(1);
  }
  console.log("  Created: cashflow-summary");

  // Total Revenue
  const totalRevenue = await services.composition.createComposition(
    workspaceId,
    {
      slug: "total-revenue",
      name: "Total Revenue",
      description: "Sum of all revenue",
      config: {
        from: "revenue",
        aggregations: [
          { field: "amount", function: AggregateFunction.Sum, alias: "total" },
          {
            field: "amount",
            function: AggregateFunction.Count,
            alias: "count",
          },
          {
            field: "amount",
            function: AggregateFunction.Avg,
            alias: "average",
          },
        ],
      },
      accessLevel: AccessLevel.Public,
      isActive: true,
    },
    userId,
  );
  if (!totalRevenue.ok) {
    console.error(
      "Create total revenue composition failed:",
      totalRevenue.error,
    );
    await container.shutdown();
    process.exit(1);
  }
  console.log("  Created: total-revenue");

  // Total Expenses
  const totalExpenses = await services.composition.createComposition(
    workspaceId,
    {
      slug: "total-expenses",
      name: "Total Expenses",
      description: "Sum of all expenses",
      config: {
        from: "expenses",
        aggregations: [
          { field: "amount", function: AggregateFunction.Sum, alias: "total" },
          {
            field: "amount",
            function: AggregateFunction.Count,
            alias: "count",
          },
          {
            field: "amount",
            function: AggregateFunction.Avg,
            alias: "average",
          },
        ],
      },
      accessLevel: AccessLevel.Public,
      isActive: true,
    },
    userId,
  );
  if (!totalExpenses.ok) {
    console.error(
      "Create total expenses composition failed:",
      totalExpenses.error,
    );
    await container.shutdown();
    process.exit(1);
  }
  console.log("  Created: total-expenses");

  // ========== EXECUTE REPORTS ==========
  console.log("\n[6] Executing accounting reports...\n");

  // Revenue by Category Report
  console.log("=" + "=".repeat(50));
  console.log("  REVENUE BY CATEGORY REPORT");
  console.log("=" + "=".repeat(50));
  const revenueByCatResult = await services.composition.execute(
    workspaceSlug,
    "revenue-by-category",
    {},
    userId,
  );
  if (revenueByCatResult.ok) {
    for (const row of revenueByCatResult.data.data) {
      const r = row as { category: string; total: number; count: number };
      console.log(
        `  ${r.category.padEnd(15)} $${r.total.toLocaleString().padStart(10)}  (${r.count} entries)`,
      );
    }
  }

  // Expenses by Category Report
  console.log("\n" + "=".repeat(51));
  console.log("  EXPENSES BY CATEGORY REPORT");
  console.log("=".repeat(51));
  const expensesByCatResult = await services.composition.execute(
    workspaceSlug,
    "expenses-by-category",
    {},
    userId,
  );
  if (expensesByCatResult.ok) {
    for (const row of expensesByCatResult.data.data) {
      const r = row as { category: string; total: number; count: number };
      console.log(
        `  ${r.category.padEnd(15)} $${r.total.toLocaleString().padStart(10)}  (${r.count} entries)`,
      );
    }
  }

  // Cashflow Summary
  console.log("\n" + "=".repeat(51));
  console.log("  CASHFLOW SUMMARY");
  console.log("=".repeat(51));
  const cashflowResult = await services.composition.execute(
    workspaceSlug,
    "cashflow-summary",
    {},
    userId,
  );
  if (cashflowResult.ok) {
    for (const row of cashflowResult.data.data) {
      const r = row as { type: string; total: number; count: number };
      console.log(
        `  ${r.type.padEnd(15)} $${r.total.toLocaleString().padStart(10)}  (${r.count} transactions)`,
      );
    }
  }

  // Profit/Loss Statement
  console.log("\n" + "=".repeat(51));
  console.log("  PROFIT & LOSS STATEMENT");
  console.log("=".repeat(51));

  const totalRevResult = await services.composition.execute(
    workspaceSlug,
    "total-revenue",
    {},
    userId,
  );
  const totalExpResult = await services.composition.execute(
    workspaceSlug,
    "total-expenses",
    {},
    userId,
  );

  if (totalRevResult.ok && totalExpResult.ok) {
    const revData = totalRevResult.data.data[0] as {
      total: number;
      count: number;
      average: number;
    };
    const expData = totalExpResult.data.data[0] as {
      total: number;
      count: number;
      average: number;
    };
    const profit = revData.total - expData.total;

    console.log(`  Total Revenue:     $${revData.total.toLocaleString()}`);
    console.log(`  Total Expenses:    $${expData.total.toLocaleString()}`);
    console.log("  " + "-".repeat(30));
    console.log(
      `  Net ${profit >= 0 ? "Profit" : "Loss"}:       $${Math.abs(profit).toLocaleString()} ${profit >= 0 ? "✓" : "✗"}`,
    );
    console.log("");
    console.log(
      `  Avg Revenue/Entry: $${Math.round(revData.average).toLocaleString()}`,
    );
    console.log(
      `  Avg Expense/Entry: $${Math.round(expData.average).toLocaleString()}`,
    );
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Accounting Test Complete!");
  console.log("=".repeat(60));
  console.log("\nWorkspace created:", workspaceSlug);
  console.log("\nCollections:");
  console.log("  - accounts (3 records)");
  console.log("  - revenue (7 records)");
  console.log("  - expenses (10 records)");
  console.log("  - transactions (7 records)");
  console.log("\nReports (Compositions):");
  console.log("  - revenue-by-category");
  console.log("  - expenses-by-category");
  console.log("  - cashflow-summary");
  console.log("  - total-revenue");
  console.log("  - total-expenses");
  console.log("\nPublic API endpoints:");
  console.log(`  GET /api/v1/c/${workspaceSlug}/revenue-by-category`);
  console.log(`  GET /api/v1/c/${workspaceSlug}/expenses-by-category`);
  console.log(`  GET /api/v1/c/${workspaceSlug}/cashflow-summary`);

  await container.shutdown();
  process.exit(0);
}

main().catch(async (error) => {
  console.error("Script failed with error:", error);
  try {
    const container = Container.getInstance();
    await container.shutdown();
  } catch {
    // Ignore shutdown errors
  }
  process.exit(1);
});
