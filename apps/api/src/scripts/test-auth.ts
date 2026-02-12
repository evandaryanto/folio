/* eslint-disable no-console */
/**
 * Test script for auth flow (using Service layer to mimic API behavior)
 *
 * Usage: bun run src/scripts/test-auth.ts
 *
 * Tests:
 * 1. Register a new user with workspace
 * 2. Login with the created user
 * 3. Get current user info
 * 4. Refresh token
 * 5. Logout
 * 6. Verify session is invalidated
 */

import { Container } from "@/bootstrap/container";

const TEST_USER = {
  email: `test-user@gmail.com`,
  password: "password123",
  name: "Test User",
  workspaceName: "Test Workspace",
  workspaceSlug: `test-workspace-${Date.now()}`,
};

async function main() {
  console.log("=".repeat(60));
  console.log("Auth Flow Test Script (Service Layer)");
  console.log("=".repeat(60));

  const container = Container.getInstance();
  const services = container.getServices();

  // Test 1: Register
  console.log("\n[1] Testing Register...");
  const registerResult = await services.auth.register({
    email: TEST_USER.email,
    password: TEST_USER.password,
    name: TEST_USER.name,
    workspaceName: TEST_USER.workspaceName,
    workspaceSlug: TEST_USER.workspaceSlug,
  });

  if (!registerResult.ok) {
    console.error("Register failed:", registerResult.error);
    console.error("  HTTP Status:", registerResult.status);
    await container.shutdown();
    process.exit(1);
  }

  console.log("Register successful!");
  console.log("  User ID:", registerResult.data.user.id);
  console.log("  Email:", registerResult.data.user.email);
  console.log("  Workspace:", registerResult.data.user.workspaceName);
  console.log("  Workspace Slug:", registerResult.data.user.workspaceSlug);
  console.log("  Access Token:", registerResult.data.tokens.accessToken);
  console.log(
    "  Refresh Token:",
    registerResult.data.tokens.refreshToken.substring(0, 20) + "...",
  );

  const userId = registerResult.data.user.id;

  // Test 2: Register duplicate (should fail)
  console.log("\n[2] Testing Duplicate Registration (should fail)...");
  const duplicateResult = await services.auth.register({
    email: TEST_USER.email,
    password: TEST_USER.password,
    name: TEST_USER.name,
    workspaceName: "Another Workspace",
    workspaceSlug: "another-workspace",
  });

  if (duplicateResult.ok) {
    console.error("ERROR: Duplicate registration should have failed!");
    await container.shutdown();
    process.exit(1);
  }

  console.log("Duplicate registration correctly rejected:");
  console.log("  Error:", duplicateResult.error.message);
  console.log("  HTTP Status:", duplicateResult.status);

  // Test 3: Login
  console.log("\n[3] Testing Login...");
  const loginResult = await services.auth.login({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });

  if (!loginResult.ok) {
    console.error("Login failed:", loginResult.error);
    console.error("  HTTP Status:", loginResult.status);
    await container.shutdown();
    process.exit(1);
  }

  console.log("Login successful!");
  console.log("  User ID:", loginResult.data.user.id);
  console.log("  Access Token:", loginResult.data.tokens.accessToken);

  // Extract session ID from login (new session created)
  const loginSessionId = loginResult.data.tokens.accessToken.replace(
    "access_",
    "",
  );
  const loginRefreshToken = loginResult.data.tokens.refreshToken;

  // Test 4: Get Current User
  console.log("\n[4] Testing Get Current User...");
  const currentUserResult = await services.auth.getCurrentUser(userId);

  if (!currentUserResult.ok) {
    console.error("Get current user failed:", currentUserResult.error);
    console.error("  HTTP Status:", currentUserResult.status);
    await container.shutdown();
    process.exit(1);
  }

  console.log("Get current user successful!");
  console.log("  User ID:", currentUserResult.data.user.id);
  console.log("  Email:", currentUserResult.data.user.email);
  console.log("  Name:", currentUserResult.data.user.name);

  // Test 5: Refresh Token
  console.log("\n[5] Testing Refresh Token...");
  const refreshResult = await services.auth.refreshToken({
    refreshToken: loginRefreshToken,
  });

  if (!refreshResult.ok) {
    console.error("Refresh token failed:", refreshResult.error);
    console.error("  HTTP Status:", refreshResult.status);
    await container.shutdown();
    process.exit(1);
  }

  console.log("Refresh token successful!");
  console.log("  New Access Token:", refreshResult.data.tokens.accessToken);

  // Test 6: Logout
  console.log("\n[6] Testing Logout...");
  const logoutResult = await services.auth.logout(loginSessionId);

  if (!logoutResult.ok) {
    console.error("Logout failed:", logoutResult.error);
    console.error("  HTTP Status:", logoutResult.status);
    await container.shutdown();
    process.exit(1);
  }

  console.log("Logout successful!");
  console.log("  Success:", logoutResult.data.success);

  // Test 7: Refresh Token after logout (should fail)
  console.log("\n[7] Testing Refresh Token After Logout (should fail)...");
  const refreshAfterLogoutResult = await services.auth.refreshToken({
    refreshToken: loginRefreshToken,
  });

  if (refreshAfterLogoutResult.ok) {
    console.error("ERROR: Refresh token after logout should have failed!");
    await container.shutdown();
    process.exit(1);
  }

  console.log("Refresh token correctly rejected after logout:");
  console.log("  Error:", refreshAfterLogoutResult.error.message);
  console.log("  HTTP Status:", refreshAfterLogoutResult.status);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("All Tests Passed!");
  console.log("=".repeat(60));
  console.log("\nTest data created:");
  console.log("  Email:", TEST_USER.email);
  console.log("  Workspace Slug:", TEST_USER.workspaceSlug);

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
