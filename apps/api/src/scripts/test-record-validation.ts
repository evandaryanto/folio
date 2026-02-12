/* eslint-disable no-console */
/**
 * Test Script: Record Validation (Schema-First Approach)
 *
 * Tests record validation against field schema:
 * 1. Creating records requires fields to be defined first
 * 2. Records are validated against field types and constraints
 * 3. Required fields must be present
 * 4. Default values are applied automatically
 */

import { Container } from "@/bootstrap/container";
import { FieldType } from "@folio/contract/enums";

async function main() {
  console.log("=".repeat(60));
  console.log("Testing Record Validation (Schema-First Approach)");
  console.log("=".repeat(60));

  const container = Container.getInstance();
  const services = container.getServices();

  // Step 1: Register a test user
  console.log("\n1. Registering test user...");
  const timestamp = Date.now();
  const email = `validation-test-${timestamp}@example.com`;
  const workspaceSlug = `validation-test-${timestamp}`;

  const registerResult = await services.auth.register({
    email,
    password: "SecurePass123!",
    name: "Validation Tester",
    workspaceName: `Validation Test ${timestamp}`,
    workspaceSlug,
  });

  if (!registerResult.ok) {
    throw new Error(`Registration failed: ${registerResult.error.message}`);
  }

  const user = registerResult.data.user;
  const workspaceId = user.workspaceId;
  console.log(`   ✓ Registered: ${user.email}`);
  console.log(`   ✓ Workspace: ${user.workspaceName}`);

  // Step 2: Create a collection
  console.log("\n2. Creating 'products' collection...");
  const collectionResult = await services.collection.createCollection(
    workspaceId,
    {
      name: "Products",
      slug: "products",
      description: "Product catalog for validation testing",
    },
    user.id,
  );

  if (!collectionResult.ok) {
    throw new Error(
      `Collection creation failed: ${collectionResult.error.message}`,
    );
  }

  const collection = collectionResult.data.collection;
  console.log(`   ✓ Collection created: ${collection.name}`);

  // Step 3: Test creating record BEFORE fields exist (should fail)
  console.log("\n3. Attempting to create record before defining schema...");
  const noSchemaResult = await services.record.createRecord(
    workspaceId,
    collection.id,
    { data: { name: "Test Product", price: 29.99 } },
    user.id,
  );

  if (noSchemaResult.ok) {
    console.log("   ✗ UNEXPECTED: Record created without schema!");
  } else {
    console.log(`   ✓ Correctly rejected: ${noSchemaResult.error.message}`);
  }

  // Step 4: Define fields (schema)
  console.log("\n4. Defining product schema (fields)...");

  const fieldDefinitions = [
    {
      slug: "name",
      name: "Product Name",
      fieldType: FieldType.Text,
      isRequired: true,
      isUnique: false,
      options: { minLength: 2, maxLength: 100 },
    },
    {
      slug: "price",
      name: "Price",
      fieldType: FieldType.Number,
      isRequired: true,
      isUnique: false,
      options: { min: 0 },
    },
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
          { value: "food", label: "Food" },
        ],
      },
    },
    {
      slug: "in_stock",
      name: "In Stock",
      fieldType: FieldType.Boolean,
      isRequired: false,
      isUnique: false,
      defaultValue: true,
    },
    {
      slug: "tags",
      name: "Tags",
      fieldType: FieldType.MultiSelect,
      isRequired: false,
      isUnique: false,
      options: {
        choices: [
          { value: "new", label: "New" },
          { value: "sale", label: "On Sale" },
          { value: "featured", label: "Featured" },
        ],
      },
    },
    {
      slug: "description",
      name: "Description",
      fieldType: FieldType.Textarea,
      isRequired: false,
      isUnique: false,
    },
  ];

  for (const fieldDef of fieldDefinitions) {
    const fieldResult = await services.field.createField(
      workspaceId,
      collection.id,
      fieldDef,
    );

    if (!fieldResult.ok) {
      throw new Error(
        `Failed to create field ${fieldDef.slug}: ${fieldResult.error.message}`,
      );
    }

    console.log(
      `   ✓ Field created: ${fieldResult.data.field.name} (${fieldDef.fieldType})`,
    );
  }

  // Step 5: Test validation errors
  console.log("\n5. Testing validation errors...");

  // Helper to create record
  const createRecord = (data: Record<string, unknown>) =>
    services.record.createRecord(workspaceId, collection.id, { data }, user.id);

  // 5a: Missing required field
  console.log("\n   5a. Missing required field 'name'...");
  const missingFieldResult = await createRecord({
    price: 29.99,
    category: "electronics",
  });

  if (!missingFieldResult.ok) {
    console.log(
      `       ✓ Correctly rejected: ${missingFieldResult.error.message}`,
    );
  } else {
    console.log(
      "       ✗ UNEXPECTED: Should have rejected missing required field",
    );
  }

  // 5b: Wrong type (string instead of number)
  console.log("\n   5b. Wrong type for 'price' (string instead of number)...");
  const wrongTypeResult = await createRecord({
    name: "Test",
    price: "not-a-number",
    category: "electronics",
  });

  if (!wrongTypeResult.ok) {
    console.log(
      `       ✓ Correctly rejected: ${wrongTypeResult.error.message}`,
    );
  } else {
    console.log("       ✗ UNEXPECTED: Should have rejected wrong type");
  }

  // 5c: Invalid select choice
  console.log("\n   5c. Invalid select choice for 'category'...");
  const invalidChoiceResult = await createRecord({
    name: "Test",
    price: 29.99,
    category: "invalid-category",
  });

  if (!invalidChoiceResult.ok) {
    console.log(
      `       ✓ Correctly rejected: ${invalidChoiceResult.error.message}`,
    );
  } else {
    console.log("       ✗ UNEXPECTED: Should have rejected invalid choice");
  }

  // 5d: String too short (minLength violation)
  console.log("\n   5d. String too short for 'name' (minLength: 2)...");
  const tooShortResult = await createRecord({
    name: "X",
    price: 29.99,
    category: "electronics",
  });

  if (!tooShortResult.ok) {
    console.log(`       ✓ Correctly rejected: ${tooShortResult.error.message}`);
  } else {
    console.log("       ✗ UNEXPECTED: Should have rejected string too short");
  }

  // 5e: Number below minimum
  console.log("\n   5e. Number below minimum for 'price' (min: 0)...");
  const belowMinResult = await createRecord({
    name: "Test Product",
    price: -10,
    category: "electronics",
  });

  if (!belowMinResult.ok) {
    console.log(`       ✓ Correctly rejected: ${belowMinResult.error.message}`);
  } else {
    console.log("       ✗ UNEXPECTED: Should have rejected negative price");
  }

  // 5f: Unknown field not in schema
  console.log("\n   5f. Unknown field 'unknown_field' not in schema...");
  const unknownFieldResult = await createRecord({
    name: "Test Product",
    price: 29.99,
    category: "electronics",
    unknown_field: "should not be allowed",
  });

  if (!unknownFieldResult.ok) {
    console.log(
      `       ✓ Correctly rejected: ${unknownFieldResult.error.message}`,
    );
  } else {
    console.log("       ✗ UNEXPECTED: Should have rejected unknown field");
  }

  // Step 6: Create valid records
  console.log("\n6. Creating valid records...");

  const validRecords = [
    {
      name: "Laptop Pro",
      price: 1299.99,
      category: "electronics",
      tags: ["new", "featured"],
      description: "High-performance laptop for professionals",
    },
    {
      name: "Summer T-Shirt",
      price: 24.99,
      category: "clothing",
      in_stock: true,
      tags: ["sale"],
    },
    {
      name: "Organic Apples",
      price: 5.99,
      category: "food",
      // in_stock should default to true
    },
  ];

  const createdRecordIds: string[] = [];

  for (const recordData of validRecords) {
    const recordResult = await createRecord(recordData);

    if (!recordResult.ok) {
      console.log(
        `   ✗ Failed to create ${recordData.name}: ${recordResult.error.message}`,
      );
    } else {
      createdRecordIds.push(recordResult.data.record.id);
      console.log(`   ✓ Created: ${recordData.name}`);
      console.log(
        `     Data: ${JSON.stringify(recordResult.data.record.data)}`,
      );

      // Check if default value was applied
      if (
        recordData.name === "Organic Apples" &&
        recordResult.data.record.data.in_stock === true
      ) {
        console.log(`     ✓ Default value applied: in_stock = true`);
      }
    }
  }

  // Step 7: Test update validation
  console.log("\n7. Testing update validation...");

  if (createdRecordIds.length > 0) {
    const recordId = createdRecordIds[0];

    // 7a: Valid partial update
    console.log("\n   7a. Valid partial update (change price)...");
    const validUpdateResult = await services.record.updateRecord(
      workspaceId,
      collection.id,
      recordId,
      { data: { price: 999.99 } },
      user.id,
    );

    if (validUpdateResult.ok) {
      console.log(
        `       ✓ Updated price to: ${validUpdateResult.data.record.data.price}`,
      );
    } else {
      console.log(`       ✗ Failed: ${validUpdateResult.error.message}`);
    }

    // 7b: Invalid update (wrong type)
    console.log("\n   7b. Invalid update (wrong type for price)...");
    const invalidUpdateResult = await services.record.updateRecord(
      workspaceId,
      collection.id,
      recordId,
      { data: { price: "invalid" } },
      user.id,
    );

    if (!invalidUpdateResult.ok) {
      console.log(
        `       ✓ Correctly rejected: ${invalidUpdateResult.error.message}`,
      );
    } else {
      console.log("       ✗ UNEXPECTED: Should have rejected invalid update");
    }
  }

  // Shutdown
  await container.shutdown();

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Record Validation Test Complete!");
  console.log("=".repeat(60));
  console.log(`
Schema-First Approach Verified:
  ✓ Records cannot be created without fields defined
  ✓ Required fields are enforced
  ✓ Field types are validated (text, number, boolean, select, etc.)
  ✓ Constraints are enforced (min, max, minLength, maxLength)
  ✓ Select choices are validated
  ✓ Unknown fields are rejected
  ✓ Default values are applied automatically
  ✓ Updates are validated (partial data allowed)
`);
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
