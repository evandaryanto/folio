/* eslint-disable no-console */
/**
 * Test script for field/schema management (using Service layer)
 *
 * Usage: bun run src/scripts/test-field.ts
 *
 * Tests:
 * 1. Register a new user with workspace
 * 2. Create a collection
 * 3. Create fields (text, number, date, select, boolean)
 * 4. List fields
 * 5. Get a specific field
 * 6. Update a field
 * 7. Delete a field
 */

import { Container } from "@/bootstrap/container";
import { FieldType } from "@folio/contract/enums";

const TEST_USER = {
  email: `test-field-${Date.now()}@example.com`,
  password: "password123",
  name: "Field Test User",
  workspaceName: "Field Test Workspace",
  workspaceSlug: `field-test-${Date.now()}`,
};

async function main() {
  console.log("=".repeat(60));
  console.log("Field/Schema Management Test Script (Service Layer)");
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

  console.log("  User ID:", userId);
  console.log("  Workspace ID:", workspaceId);

  // Test 2: Create Collection
  console.log("\n[2] Creating 'products' collection...");
  const collectionResult = await services.collection.createCollection(
    workspaceId,
    {
      slug: "products",
      name: "Products",
      description: "Product catalog with various field types",
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

  // Test 3: Create Fields
  console.log("\n[3] Creating fields...");

  // 3a: Text field
  console.log("  Creating 'name' (text) field...");
  const nameFieldResult = await services.field.createField(
    workspaceId,
    collectionId,
    {
      slug: "name",
      name: "Product Name",
      fieldType: FieldType.Text,
      isRequired: true,
      isUnique: false,
      options: {
        minLength: 1,
        maxLength: 200,
      },
      sortOrder: 1,
    },
  );

  if (!nameFieldResult.ok) {
    console.error("Create name field failed:", nameFieldResult.error);
    await container.shutdown();
    process.exit(1);
  }
  console.log("    Field ID:", nameFieldResult.data.field.id);

  // 3b: Number field
  console.log("  Creating 'price' (number) field...");
  const priceFieldResult = await services.field.createField(
    workspaceId,
    collectionId,
    {
      slug: "price",
      name: "Price",
      fieldType: FieldType.Number,
      isRequired: true,
      isUnique: false,
      options: {
        min: 0,
        precision: 2,
      },
      sortOrder: 2,
    },
  );

  if (!priceFieldResult.ok) {
    console.error("Create price field failed:", priceFieldResult.error);
    await container.shutdown();
    process.exit(1);
  }
  console.log("    Field ID:", priceFieldResult.data.field.id);

  // 3c: Select field
  console.log("  Creating 'category' (select) field...");
  const categoryFieldResult = await services.field.createField(
    workspaceId,
    collectionId,
    {
      slug: "category",
      name: "Category",
      fieldType: FieldType.Select,
      isRequired: true,
      isUnique: false,
      options: {
        choices: [
          { value: "electronics", label: "Electronics" },
          { value: "clothing", label: "Clothing" },
          { value: "food", label: "Food & Beverages" },
          { value: "home", label: "Home & Garden" },
        ],
      },
      sortOrder: 3,
    },
  );

  if (!categoryFieldResult.ok) {
    console.error("Create category field failed:", categoryFieldResult.error);
    await container.shutdown();
    process.exit(1);
  }
  const categoryFieldId = categoryFieldResult.data.field.id;
  console.log("    Field ID:", categoryFieldId);

  // 3d: Boolean field
  console.log("  Creating 'in_stock' (boolean) field...");
  const inStockFieldResult = await services.field.createField(
    workspaceId,
    collectionId,
    {
      slug: "in_stock",
      name: "In Stock",
      fieldType: FieldType.Boolean,
      isRequired: false,
      isUnique: false,
      defaultValue: true,
      sortOrder: 4,
    },
  );

  if (!inStockFieldResult.ok) {
    console.error("Create in_stock field failed:", inStockFieldResult.error);
    await container.shutdown();
    process.exit(1);
  }
  console.log("    Field ID:", inStockFieldResult.data.field.id);

  // 3e: Date field
  console.log("  Creating 'release_date' (date) field...");
  const releaseDateFieldResult = await services.field.createField(
    workspaceId,
    collectionId,
    {
      slug: "release_date",
      name: "Release Date",
      fieldType: FieldType.Date,
      isRequired: false,
      isUnique: false,
      sortOrder: 5,
    },
  );

  if (!releaseDateFieldResult.ok) {
    console.error(
      "Create release_date field failed:",
      releaseDateFieldResult.error,
    );
    await container.shutdown();
    process.exit(1);
  }
  const releaseDateFieldId = releaseDateFieldResult.data.field.id;
  console.log("    Field ID:", releaseDateFieldId);

  // 3f: Textarea field
  console.log("  Creating 'description' (textarea) field...");
  const descriptionFieldResult = await services.field.createField(
    workspaceId,
    collectionId,
    {
      slug: "description",
      name: "Description",
      fieldType: FieldType.Textarea,
      isRequired: false,
      isUnique: false,
      options: {
        maxLength: 5000,
      },
      sortOrder: 6,
    },
  );

  if (!descriptionFieldResult.ok) {
    console.error(
      "Create description field failed:",
      descriptionFieldResult.error,
    );
    await container.shutdown();
    process.exit(1);
  }
  console.log("    Field ID:", descriptionFieldResult.data.field.id);

  console.log("  Created 6 fields successfully!");

  // Test 4: List Fields
  console.log("\n[4] Listing all fields...");
  const listResult = await services.field.listFields(workspaceId, collectionId);

  if (!listResult.ok) {
    console.error("List fields failed:", listResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log(`  Found ${listResult.data.fields.length} field(s):`);
  for (const field of listResult.data.fields) {
    console.log(
      `    - ${field.slug} (${field.fieldType})${field.isRequired ? " [required]" : ""}`,
    );
  }

  // Test 5: Get Specific Field
  console.log("\n[5] Getting 'category' field details...");
  const getResult = await services.field.getField(
    workspaceId,
    collectionId,
    categoryFieldId,
  );

  if (!getResult.ok) {
    console.error("Get field failed:", getResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Field details:");
  console.log("    Slug:", getResult.data.field.slug);
  console.log("    Name:", getResult.data.field.name);
  console.log("    Type:", getResult.data.field.fieldType);
  console.log("    Required:", getResult.data.field.isRequired);
  console.log(
    "    Choices:",
    getResult.data.field.options?.choices?.length,
    "options",
  );

  // Test 6: Update Field
  console.log("\n[6] Updating 'category' field (add new choice)...");
  const updateResult = await services.field.updateField(
    workspaceId,
    collectionId,
    categoryFieldId,
    {
      name: "Product Category",
      options: {
        choices: [
          { value: "electronics", label: "Electronics" },
          { value: "clothing", label: "Clothing" },
          { value: "food", label: "Food & Beverages" },
          { value: "home", label: "Home & Garden" },
          { value: "sports", label: "Sports & Outdoors" },
        ],
      },
    },
  );

  if (!updateResult.ok) {
    console.error("Update field failed:", updateResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Updated field:");
  console.log("    Name:", updateResult.data.field.name);
  console.log(
    "    Choices:",
    updateResult.data.field.options?.choices?.length,
    "options",
  );

  // Test 7: Delete Field
  console.log("\n[7] Deleting 'release_date' field...");
  const deleteResult = await services.field.deleteField(
    workspaceId,
    collectionId,
    releaseDateFieldId,
  );

  if (!deleteResult.ok) {
    console.error("Delete field failed:", deleteResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Deleted:", deleteResult.data.success);

  // Verify deletion
  const verifyListResult = await services.field.listFields(
    workspaceId,
    collectionId,
  );

  if (!verifyListResult.ok) {
    console.error("Verify list failed:", verifyListResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log(
    "  Remaining fields:",
    verifyListResult.data.fields.length,
    "(was 6)",
  );

  // Test 8: Create duplicate slug (should fail)
  console.log("\n[8] Testing duplicate slug (should fail)...");
  const duplicateResult = await services.field.createField(
    workspaceId,
    collectionId,
    {
      slug: "name",
      name: "Another Name Field",
      fieldType: FieldType.Text,
      isRequired: false,
      isUnique: false,
      sortOrder: 10,
    },
  );

  if (duplicateResult.ok) {
    console.error("ERROR: Duplicate slug should have failed!");
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Duplicate correctly rejected:");
  console.log("    Error:", duplicateResult.error.message);
  console.log("    HTTP Status:", duplicateResult.status);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("All Field Tests Passed!");
  console.log("=".repeat(60));
  console.log("\nTest data created:");
  console.log("  Workspace:", TEST_USER.workspaceSlug);
  console.log("  Collection: products");
  console.log("  Fields: name, price, category, in_stock, description");

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
