/* eslint-disable no-console */
/**
 * Test script for API key management (using Service layer)
 *
 * Usage: bun run src/scripts/test-api-key.ts
 *
 * Tests:
 * 1. Register a new user with workspace
 * 2. Create an API key
 * 3. List API keys
 * 4. Get specific API key
 * 5. Update API key
 * 6. Revoke API key
 * 7. Delete API key
 */

import { Container } from "@/bootstrap/container";

const TEST_USER = {
  email: `test-apikey-${Date.now()}@example.com`,
  password: "password123",
  name: "API Key Test User",
  workspaceName: "API Key Test Workspace",
  workspaceSlug: `apikey-test-${Date.now()}`,
};

async function main() {
  console.log("=".repeat(60));
  console.log("API Key Management Test Script (Service Layer)");
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

  // Test 2: Create API Key
  console.log("\n[2] Creating API key...");
  const createResult = await services.apiKey.createApiKey(
    workspaceId,
    {
      name: "Production API Key",
      scopes: ["read:records", "write:records", "read:collections"],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    },
    userId,
  );

  if (!createResult.ok) {
    console.error("Create API key failed:", createResult.error);
    console.error("  HTTP Status:", createResult.status);
    await container.shutdown();
    process.exit(1);
  }

  const apiKeyId = createResult.data.apiKey.id;
  const apiKeySecret = createResult.data.apiKey.key;

  console.log("  API Key ID:", apiKeyId);
  console.log("  API Key Prefix:", createResult.data.apiKey.keyPrefix);
  console.log("  Full Key:", apiKeySecret.substring(0, 20) + "...");
  console.log("  Scopes:", createResult.data.apiKey.scopes?.join(", "));
  console.log("  Expires At:", createResult.data.apiKey.expiresAt);

  // Test 3: Create another API key (for testing list)
  console.log("\n[3] Creating second API key...");
  const createResult2 = await services.apiKey.createApiKey(
    workspaceId,
    {
      name: "Development API Key",
      scopes: ["read:records"],
    },
    userId,
  );

  if (!createResult2.ok) {
    console.error("Create second API key failed:", createResult2.error);
    await container.shutdown();
    process.exit(1);
  }

  const apiKeyId2 = createResult2.data.apiKey.id;
  console.log("  API Key ID:", apiKeyId2);
  console.log("  Name:", createResult2.data.apiKey.name);

  // Test 4: List API Keys
  console.log("\n[4] Listing API keys...");
  const listResult = await services.apiKey.listApiKeys(workspaceId);

  if (!listResult.ok) {
    console.error("List API keys failed:", listResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log(`  Found ${listResult.data.apiKeys.length} API key(s):`);
  for (const key of listResult.data.apiKeys) {
    console.log(`    - ${key.name} (${key.keyPrefix}...)`);
    console.log(
      `      Active: ${key.isActive}, Scopes: ${key.scopes?.length || 0}`,
    );
  }

  // Test 5: Get Specific API Key
  console.log("\n[5] Getting 'Production API Key' details...");
  const getResult = await services.apiKey.getApiKey(workspaceId, apiKeyId);

  if (!getResult.ok) {
    console.error("Get API key failed:", getResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log("  API Key details:");
  console.log("    ID:", getResult.data.apiKey.id);
  console.log("    Name:", getResult.data.apiKey.name);
  console.log("    Prefix:", getResult.data.apiKey.keyPrefix);
  console.log("    Active:", getResult.data.apiKey.isActive);
  console.log("    Scopes:", getResult.data.apiKey.scopes?.join(", "));

  // Test 6: Update API Key
  console.log("\n[6] Updating API key (change name and add scope)...");
  const updateResult = await services.apiKey.updateApiKey(
    workspaceId,
    apiKeyId,
    {
      name: "Production API Key (Updated)",
      scopes: [
        "read:records",
        "write:records",
        "read:collections",
        "write:collections",
      ],
    },
  );

  if (!updateResult.ok) {
    console.error("Update API key failed:", updateResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Updated API key:");
  console.log("    Name:", updateResult.data.apiKey.name);
  console.log("    Scopes:", updateResult.data.apiKey.scopes?.join(", "));

  // Test 7: Revoke API Key
  console.log("\n[7] Revoking API key...");
  const revokeResult = await services.apiKey.revokeApiKey(
    workspaceId,
    apiKeyId,
    userId,
  );

  if (!revokeResult.ok) {
    console.error("Revoke API key failed:", revokeResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Revoked API key:");
  console.log("    Active:", revokeResult.data.apiKey.isActive);
  console.log("    Revoked At:", revokeResult.data.apiKey.revokedAt);
  console.log("    Revoked By:", revokeResult.data.apiKey.revokedBy);

  // Test 8: Verify revoked key shows as inactive
  console.log("\n[8] Verifying revoked key is inactive...");
  const verifyResult = await services.apiKey.getApiKey(workspaceId, apiKeyId);

  if (!verifyResult.ok) {
    console.error("Verify API key failed:", verifyResult.error);
    await container.shutdown();
    process.exit(1);
  }

  if (verifyResult.data.apiKey.isActive) {
    console.error("ERROR: Revoked API key should be inactive!");
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Confirmed: API key is inactive after revocation");

  // Test 9: Delete API Key (the second one)
  console.log("\n[9] Deleting second API key...");
  const deleteResult = await services.apiKey.deleteApiKey(
    workspaceId,
    apiKeyId2,
  );

  if (!deleteResult.ok) {
    console.error("Delete API key failed:", deleteResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log("  Deleted:", deleteResult.data.success);

  // Verify deletion
  const verifyListResult = await services.apiKey.listApiKeys(workspaceId);

  if (!verifyListResult.ok) {
    console.error("Verify list failed:", verifyListResult.error);
    await container.shutdown();
    process.exit(1);
  }

  console.log(
    "  Remaining API keys:",
    verifyListResult.data.apiKeys.length,
    "(was 2)",
  );

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("All API Key Tests Passed!");
  console.log("=".repeat(60));
  console.log("\nTest data created:");
  console.log("  Workspace:", TEST_USER.workspaceSlug);
  console.log("  API Keys: 1 remaining (revoked)");

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
