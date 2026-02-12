/* eslint-disable no-console */
/**
 * Test script for composition flow (using Service layer)
 *
 * Usage: bun run src/scripts/test-composition.ts
 *
 * Tests:
 * 1. Register a new user with workspace
 * 2. Create a collection (expenses)
 * 3. Create records in the collection
 * 4. Create a composition
 * 5. List compositions
 * 6. Execute the composition
 * 7. Update the composition
 * 8. Delete the composition
 */

import { Container } from "@/bootstrap/container";
import {
  AccessLevel,
  AggregateFunction,
  SortDirection,
  FieldType,
} from "@folio/contract/enums";

const TEST_USER = {
  email: `test-comp-${Date.now()}@example.com`,
  password: "password123",
  name: "Composition Test User",
  workspaceName: "Composition Test Workspace",
  workspaceSlug: `comp-test-${Date.now()}`,
};

const TEST_EXPENSES = [
  { category: "Food", amount: 50, date: "2024-01-15" },
  { category: "Food", amount: 30, date: "2024-01-20" },
  { category: "Transport", amount: 25, date: "2024-01-10" },
  { category: "Transport", amount: 40, date: "2024-02-05" },
  { category: "Entertainment", amount: 100, date: "2024-02-10" },
  { category: "Food", amount: 45, date: "2024-02-15" },
];

async function main() {
  console.log("=".repeat(60));
  console.log("Composition Flow Test Script (Service Layer)");
  console.log("=".repeat(60));

  const container = Container.getInstance();
  const services = container.getServices();

  // Test 1: Register
  console.log("\n[1] Registering test user...");
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

  console.log("  User ID:", userId);
  console.log("  Workspace ID:", workspaceId);
  console.log("  Workspace Slug:", workspaceSlug);

  // Test 2: Create Collection
  console.log("\n[2] Creating 'expenses' collection...");
  const collectionResult = await services.collection.createCollection(
    workspaceId,
    {
      slug: "expenses",
      name: "Expenses",
      description: "Track expenses by category",
    },
    userId,
  );

  if (!collectionResult.ok) {
    console.error("Create collection failed:", collectionResult.error);
    await container.shutdown();
    process.exit(1);
  }

  const collectionId = collectionResult.data.collection.id;
  console.log("  Collection ID:", collectionId);
  console.log("  Collection Slug:", collectionResult.data.collection.slug);

  // Test 2.5: Create Fields (Schema-first approach)
  console.log("\n[2.5] Creating fields for expenses collection...");
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
      options: { min: 0 },
    },
    {
      slug: "date",
      name: "Date",
      fieldType: FieldType.Date,
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
  console.log(
    `  Created ${expenseFields.length} fields: category, amount, date`,
  );

  // Test 3: Create Records
  console.log("\n[3] Creating expense records...");
  for (const expense of TEST_EXPENSES) {
    const recordResult = await services.record.createRecord(
      workspaceId,
      collectionId,
      { data: expense },
      userId,
    );

    if (!recordResult.ok) {
      console.error("Create record failed:", recordResult.error);
      await container.shutdown();
      process.exit(1);
    }
  }
  console.log(`  Created ${TEST_EXPENSES.length} expense records`);

  // Test 4: Create Composition
  console.log("\n[4] Creating composition 'expenses-by-category'...");
  const compositionResult = await services.composition.createComposition(
    workspaceId,
    {
      slug: "expenses-by-category",
      name: "Expenses by Category",
      description: "Aggregate expenses grouped by category",
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

  if (!compositionResult.ok) {
    console.error("Create composition failed:", compositionResult.error);
    console.error("  HTTP Status:", compositionResult.status);
    await container.shutdown();
    process.exit(1);
  }

  const compositionId = compositionResult.data.composition.id;
  console.log("  Composition ID:", compositionId);
  console.log("  Composition Slug:", compositionResult.data.composition.slug);
  console.log(
    "  Access Level:",
    compositionResult.data.composition.accessLevel,
  );

  // Test 5: List Compositions
  console.log("\n[5] Listing compositions...");
  const listResult = await services.composition.listCompositions(workspaceId);

  if (!listResult.ok) {
    console.error("List compositions failed:", listResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log(`  Found ${listResult.data.compositions.length} composition(s)`);
  for (const comp of listResult.data.compositions) {
    console.log(`    - ${comp.slug}: ${comp.name}`);
  }

  // Test 6: Execute Composition
  console.log("\n[6] Executing composition...");
  const executeResult = await services.composition.execute(
    workspaceSlug,
    "expenses-by-category",
    {},
    userId,
  );

  if (!executeResult.ok) {
    console.error("Execute composition failed:", executeResult.error);
    console.error("  HTTP Status:", executeResult.status);
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Execution successful!");
  console.log("  Results:");
  for (const row of executeResult.data.data) {
    console.log(`    - ${row.category}: $${row.total} (${row.count} records)`);
  }
  console.log("  Metadata:", executeResult.data.metadata);

  // Test 7: Update Composition
  console.log("\n[7] Updating composition (add limit)...");
  const updateResult = await services.composition.updateComposition(
    workspaceId,
    compositionId,
    {
      name: "Top Expenses by Category",
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
        limit: 2,
      },
    },
  );

  if (!updateResult.ok) {
    console.error("Update composition failed:", updateResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Updated name:", updateResult.data.composition.name);
  console.log("  Updated limit:", updateResult.data.composition.config.limit);

  // Test 8: Execute Updated Composition (should return only 2)
  console.log("\n[8] Executing updated composition (with limit)...");
  const executeUpdatedResult = await services.composition.execute(
    workspaceSlug,
    "expenses-by-category",
    {},
    userId,
  );

  if (!executeUpdatedResult.ok) {
    console.error(
      "Execute updated composition failed:",
      executeUpdatedResult.error,
    );
    await container.shutdown();
    process.exit(1);
  }

  console.log(`  Results (limited to 2):`);
  for (const row of executeUpdatedResult.data.data) {
    console.log(`    - ${row.category}: $${row.total}`);
  }

  // Test 9: Delete Composition
  console.log("\n[9] Deleting composition...");
  const deleteResult = await services.composition.deleteComposition(
    workspaceId,
    compositionId,
  );

  if (!deleteResult.ok) {
    console.error("Delete composition failed:", deleteResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Deleted:", deleteResult.data.success);

  // Verify deletion
  const verifyResult = await services.composition.getComposition(
    workspaceId,
    compositionId,
  );

  if (verifyResult.ok) {
    console.error("ERROR: Composition should have been deleted!");
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Verified: composition no longer exists");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("All Composition Tests Passed!");
  console.log("=".repeat(60));
  console.log("\nTest data created:");
  console.log("  Email:", TEST_USER.email);
  console.log("  Workspace Slug:", TEST_USER.workspaceSlug);
  console.log("  Collection: expenses");
  console.log(`  Records: ${TEST_EXPENSES.length} expense entries`);

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
