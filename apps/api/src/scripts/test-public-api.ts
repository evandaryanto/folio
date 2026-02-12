/* eslint-disable no-console */
/**
 * Test script for public composition API (using HTTP fetch)
 *
 * Usage: bun run src/scripts/test-public-api.ts
 *
 * Tests:
 * 1. Setup: Register user, create collection, records, and composition
 * 2. Test public composition access (no auth required)
 * 3. Test internal composition access (requires auth)
 * 4. Test private composition access (should fail without auth)
 * 5. Test query parameters
 */

import { Container } from "@/bootstrap/container";
import {
  AccessLevel,
  AggregateFunction,
  SortDirection,
  FieldType,
} from "@folio/contract/enums";

const TEST_USER = {
  email: `test-public-${Date.now()}@example.com`,
  password: "password123",
  name: "Public API Test User",
  workspaceName: "Public API Test Workspace",
  workspaceSlug: `public-test-${Date.now()}`,
};

const TEST_EXPENSES = [
  { category: "Food", amount: 100, month: "2024-01" },
  { category: "Food", amount: 150, month: "2024-02" },
  { category: "Transport", amount: 80, month: "2024-01" },
  { category: "Transport", amount: 60, month: "2024-02" },
];

async function main() {
  console.log("=".repeat(60));
  console.log("Public Composition API Test Script");
  console.log("=".repeat(60));

  const container = Container.getInstance();
  const services = container.getServices();
  const config = container.getConfig();
  const port = config.server.port;
  const baseUrl = `http://localhost:${port}`;

  // ========== SETUP ==========
  console.log("\n[Setup] Creating test data...");

  // Register user
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
  const accessToken = registerResult.data.tokens.accessToken;

  console.log("  User created:", userId);
  console.log("  Workspace:", workspaceSlug);

  // Create collection
  const collectionResult = await services.collection.createCollection(
    workspaceId,
    { slug: "expenses", name: "Expenses" },
    userId,
  );

  if (!collectionResult.ok) {
    console.error("Create collection failed:", collectionResult.error);
    await container.shutdown();
    process.exit(1);
  }

  const collectionId = collectionResult.data.collection.id;
  console.log("  Collection created:", collectionId);

  // Create fields (schema-first)
  const expenseFields = [
    {
      slug: "category",
      name: "Category",
      fieldType: FieldType.Text,
      isRequired: true,
      isUnique: false,
    },
    {
      slug: "amount",
      name: "Amount",
      fieldType: FieldType.Number,
      isRequired: true,
      isUnique: false,
    },
    {
      slug: "month",
      name: "Month",
      fieldType: FieldType.Text,
      isRequired: true,
      isUnique: false,
    },
  ];

  for (const field of expenseFields) {
    const fieldResult = await services.field.createField(
      workspaceId,
      collectionId,
      field,
    );
    if (!fieldResult.ok) {
      console.error("Create field failed:", fieldResult.error);
      await container.shutdown();
      process.exit(1);
    }
  }
  console.log(`  Fields created: ${expenseFields.length}`);

  // Create records
  for (const expense of TEST_EXPENSES) {
    await services.record.createRecord(
      workspaceId,
      collectionId,
      { data: expense },
      userId,
    );
  }
  console.log(`  Records created: ${TEST_EXPENSES.length}`);

  // Create PUBLIC composition
  const publicCompResult = await services.composition.createComposition(
    workspaceId,
    {
      slug: "public-summary",
      name: "Public Summary",
      config: {
        from: "expenses",
        groupBy: ["category"],
        aggregations: [
          { field: "amount", function: AggregateFunction.Sum, alias: "total" },
        ],
        sort: [{ field: "total", direction: SortDirection.Desc }],
      },
      accessLevel: AccessLevel.Public,
      isActive: true,
    },
    userId,
  );

  if (!publicCompResult.ok) {
    console.error("Create public composition failed:", publicCompResult.error);
    await container.shutdown();
    process.exit(1);
  }
  console.log("  Public composition created");

  // Create INTERNAL composition
  const internalCompResult = await services.composition.createComposition(
    workspaceId,
    {
      slug: "internal-summary",
      name: "Internal Summary",
      config: {
        from: "expenses",
        groupBy: ["month"],
        aggregations: [
          { field: "amount", function: AggregateFunction.Sum, alias: "total" },
        ],
      },
      accessLevel: AccessLevel.Internal,
      isActive: true,
    },
    userId,
  );

  if (!internalCompResult.ok) {
    console.error(
      "Create internal composition failed:",
      internalCompResult.error,
    );
    await container.shutdown();
    process.exit(1);
  }
  console.log("  Internal composition created");

  // Create PRIVATE composition
  const privateCompResult = await services.composition.createComposition(
    workspaceId,
    {
      slug: "private-summary",
      name: "Private Summary",
      config: {
        from: "expenses",
        aggregations: [
          {
            field: "amount",
            function: AggregateFunction.Count,
            alias: "count",
          },
        ],
      },
      accessLevel: AccessLevel.Private,
      isActive: true,
    },
    userId,
  );

  if (!privateCompResult.ok) {
    console.error(
      "Create private composition failed:",
      privateCompResult.error,
    );
    await container.shutdown();
    process.exit(1);
  }
  console.log("  Private composition created");

  console.log("\n  Setup complete!");

  // ========== TEST 1: Public Access ==========
  console.log("\n[1] Testing PUBLIC composition (no auth)...");
  const publicUrl = `${baseUrl}/api/v1/c/${workspaceSlug}/public-summary`;
  console.log(`  URL: ${publicUrl}`);

  const publicResponse = await fetch(publicUrl);
  console.log(`  Status: ${publicResponse.status}`);

  if (publicResponse.status !== 200) {
    console.error("ERROR: Public composition should be accessible!");
    const body = await publicResponse.text();
    console.error("  Response:", body);
    await container.shutdown();
    process.exit(1);
  }

  const publicData = (await publicResponse.json()) as {
    data: Array<{ category: string; total: number }>;
  };
  console.log("  Results:");
  for (const row of publicData.data) {
    console.log(`    - ${row.category}: $${row.total}`);
  }
  console.log("  SUCCESS: Public composition accessible without auth!");

  // ========== TEST 2: Internal Access Without Auth ==========
  console.log("\n[2] Testing INTERNAL composition (no auth - should fail)...");
  const internalUrl = `${baseUrl}/api/v1/c/${workspaceSlug}/internal-summary`;
  console.log(`  URL: ${internalUrl}`);

  const internalNoAuthResponse = await fetch(internalUrl);
  console.log(`  Status: ${internalNoAuthResponse.status}`);

  if (internalNoAuthResponse.status !== 401) {
    console.error(
      "ERROR: Internal composition should require auth! Got:",
      internalNoAuthResponse.status,
    );
    await container.shutdown();
    process.exit(1);
  }

  console.log("  SUCCESS: Internal composition correctly requires auth!");

  // ========== TEST 3: Internal Access With Auth ==========
  console.log("\n[3] Testing INTERNAL composition (with auth)...");

  const internalWithAuthResponse = await fetch(internalUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  console.log(`  Status: ${internalWithAuthResponse.status}`);

  if (internalWithAuthResponse.status !== 200) {
    console.error(
      "ERROR: Internal composition should be accessible with auth!",
    );
    const body = await internalWithAuthResponse.text();
    console.error("  Response:", body);
    await container.shutdown();
    process.exit(1);
  }

  const internalData = (await internalWithAuthResponse.json()) as {
    data: Array<{ month: string; total: number }>;
  };
  console.log("  Results:");
  for (const row of internalData.data) {
    console.log(`    - ${row.month}: $${row.total}`);
  }
  console.log("  SUCCESS: Internal composition accessible with auth!");

  // ========== TEST 4: Private Access ==========
  console.log(
    "\n[4] Testing PRIVATE composition (should fail even with auth)...",
  );
  const privateUrl = `${baseUrl}/api/v1/c/${workspaceSlug}/private-summary`;
  console.log(`  URL: ${privateUrl}`);

  const privateResponse = await fetch(privateUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  console.log(`  Status: ${privateResponse.status}`);

  if (privateResponse.status !== 403) {
    console.error(
      "ERROR: Private composition should not be accessible via public API! Got:",
      privateResponse.status,
    );
    const body = await privateResponse.text();
    console.error("  Response:", body);
    await container.shutdown();
    process.exit(1);
  }

  console.log("  SUCCESS: Private composition correctly forbidden!");

  // ========== TEST 5: Non-existent Composition ==========
  console.log("\n[5] Testing non-existent composition...");
  const notFoundUrl = `${baseUrl}/api/v1/c/${workspaceSlug}/does-not-exist`;
  console.log(`  URL: ${notFoundUrl}`);

  const notFoundResponse = await fetch(notFoundUrl);
  console.log(`  Status: ${notFoundResponse.status}`);

  if (notFoundResponse.status !== 404) {
    console.error("ERROR: Non-existent composition should return 404!");
    await container.shutdown();
    process.exit(1);
  }

  console.log("  SUCCESS: Non-existent composition returns 404!");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("All Public API Tests Passed!");
  console.log("=".repeat(60));
  console.log("\nAccess Level Behavior:");
  console.log("  - Public: Accessible without auth ✓");
  console.log("  - Internal: Requires auth ✓");
  console.log("  - Private: Not accessible via public API ✓");

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
