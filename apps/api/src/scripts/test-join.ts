/* eslint-disable no-console */
/**
 * Test script for JOIN functionality
 *
 * Usage: bun run src/scripts/test-join.ts
 *
 * Uses existing accounting workspace to create a composition with JOIN
 * Login: accounting-1770280217644@example.com / password123
 */

import { Container } from "@/bootstrap/container";
import {
  AccessLevel,
  AggregateFunction,
  SortDirection,
  JoinType,
} from "@folio/contract/enums";

const TEST_CREDENTIALS = {
  email: "accounting.user@example.com",
  password: "password123",
};

async function main() {
  console.log("=".repeat(60));
  console.log("JOIN Test Script");
  console.log("=".repeat(60));

  const container = Container.getInstance();
  const services = container.getServices();

  // ========== LOGIN ==========
  console.log("\n[1] Logging in...");
  const loginResult = await services.auth.login({
    email: TEST_CREDENTIALS.email,
    password: TEST_CREDENTIALS.password,
  });

  if (!loginResult.ok) {
    console.error("Login failed:", loginResult.error);
    console.log("\nMake sure you've run test-accounting.ts first!");
    await container.shutdown();
    process.exit(1);
  }

  const userId = loginResult.data.user.id;
  const workspaceId = loginResult.data.user.workspaceId;
  const workspaceSlug = loginResult.data.user.workspaceSlug;

  console.log("  Logged in as:", loginResult.data.user.email);
  console.log("  Workspace:", workspaceSlug);

  // ========== LIST EXISTING COLLECTIONS ==========
  console.log("\n[2] Checking existing collections...");
  const collectionsResult = await services.collection.listCollections(
    workspaceId,
    {},
  );

  if (!collectionsResult.ok) {
    console.error("Failed to list collections:", collectionsResult.error);
    await container.shutdown();
    process.exit(1);
  }

  const collections = collectionsResult.data.collections;
  console.log("  Found collections:");
  for (const col of collections) {
    console.log(`    - ${col.slug} (${col.name})`);
  }

  // Check if we have the required collections
  const hasTransactions = collections.some((c) => c.slug === "transactions");
  const hasAccounts = collections.some((c) => c.slug === "accounts");

  if (!hasTransactions || !hasAccounts) {
    console.error("\nMissing required collections: transactions, accounts");
    console.log("Make sure you've run test-accounting.ts first!");
    await container.shutdown();
    process.exit(1);
  }

  // ========== CREATE JOIN COMPOSITION ==========
  console.log("\n[3] Creating composition with JOIN...");

  // Transaction details with account info (JOIN transactions -> accounts)
  const joinComposition = await services.composition.createComposition(
    workspaceId,
    {
      slug: "transactions-with-accounts",
      name: "Transactions with Account Details",
      description:
        "Transaction list joined with account information (balance, type)",
      config: {
        from: "transactions",
        joins: [
          {
            collection: "accounts",
            on: {
              left: "account", // transactions.account
              right: "name", // accounts.name
            },
            type: JoinType.Left,
          },
        ],
        select: [
          "description",
          "type",
          "amount",
          "date",
          "account",
          // From joined accounts collection
          "accounts.type",
          "accounts.balance",
        ],
        sort: [{ field: "date", direction: SortDirection.Desc }],
      },
      accessLevel: AccessLevel.Public,
      isActive: true,
    },
    userId,
  );

  if (!joinComposition.ok) {
    // Check if it already exists
    if (joinComposition.error.code === "ALREADY_EXISTS") {
      console.log("  Composition already exists, skipping creation");
    } else {
      console.error("Create join composition failed:", joinComposition.error);
      await container.shutdown();
      process.exit(1);
    }
  } else {
    console.log("  Created: transactions-with-accounts");
  }

  // Cashflow by Account (JOIN + GROUP BY + AGGREGATE)
  const cashflowByAccount = await services.composition.createComposition(
    workspaceId,
    {
      slug: "cashflow-by-account",
      name: "Cashflow by Account",
      description: "Total cashflow grouped by account with account type info",
      config: {
        from: "transactions",
        joins: [
          {
            collection: "accounts",
            on: {
              left: "account",
              right: "name",
            },
            type: JoinType.Left,
          },
        ],
        groupBy: ["account", "accounts.type"],
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

  if (!cashflowByAccount.ok) {
    if (cashflowByAccount.error.code === "ALREADY_EXISTS") {
      console.log("  Composition already exists, skipping creation");
    } else {
      console.error(
        "Create cashflow-by-account composition failed:",
        cashflowByAccount.error,
      );
      await container.shutdown();
      process.exit(1);
    }
  } else {
    console.log("  Created: cashflow-by-account");
  }

  // ========== TEST EXECUTION ==========
  console.log("\n[4] Testing JOIN execution...\n");

  // Test transactions-with-accounts
  console.log("=" + "=".repeat(60));
  console.log("  TRANSACTIONS WITH ACCOUNT DETAILS (JOIN)");
  console.log("=" + "=".repeat(60));

  const joinResult = await services.composition.execute(
    workspaceSlug,
    "transactions-with-accounts",
    {},
    userId,
  );

  if (joinResult.ok) {
    console.log(`\n  ${joinResult.data.data.length} transactions found:\n`);
    for (const row of joinResult.data.data) {
      const r = row as {
        description: string;
        type: string;
        amount: number;
        account: string;
        accounts_type?: string;
        accounts_balance?: number;
      };
      console.log(
        `  ${r.description.substring(0, 25).padEnd(25)} | ${r.type.padEnd(10)} | $${String(r.amount).padStart(8)} | ${r.account} (${r.accounts_type ?? "N/A"})`,
      );
    }
  } else {
    console.error("  Execution failed:", joinResult.error);
  }

  // Test cashflow-by-account
  console.log("\n" + "=".repeat(61));
  console.log("  CASHFLOW BY ACCOUNT (JOIN + GROUP BY)");
  console.log("=".repeat(61));

  const cashflowResult = await services.composition.execute(
    workspaceSlug,
    "cashflow-by-account",
    {},
    userId,
  );

  if (cashflowResult.ok) {
    console.log(`\n  Cashflow by account:\n`);
    for (const row of cashflowResult.data.data) {
      const r = row as {
        account: string;
        accounts_type?: string;
        total: number;
        count: number;
      };
      console.log(
        `  ${r.account.padEnd(20)} | ${(r.accounts_type ?? "N/A").padEnd(8)} | $${String(r.total).padStart(10)} | ${r.count} txns`,
      );
    }
  } else {
    console.error("  Execution failed:", cashflowResult.error);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("JOIN Test Complete!");
  console.log("=".repeat(60));
  console.log("\nNew compositions created:");
  console.log("  - transactions-with-accounts (SELECT with JOIN)");
  console.log("  - cashflow-by-account (JOIN + GROUP BY + AGGREGATE)");
  console.log("\nPublic API endpoints:");
  console.log(`  GET /api/v1/c/${workspaceSlug}/transactions-with-accounts`);
  console.log(`  GET /api/v1/c/${workspaceSlug}/cashflow-by-account`);

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
