/* eslint-disable no-console */
import initApp, { getContainer } from "./bootstrap";

const app = initApp();
const container = getContainer();
const config = container.getConfig();

const server = Bun.serve({
  port: config.server.port,
  fetch: app.fetch,
});

console.log(`Server running on http://localhost:${server.port}`);
console.log(
  `API docs available at http://localhost:${server.port}/api/v1/docs`,
);

// Graceful shutdown
const shutdown = async () => {
  console.log("\nShutting down gracefully...");
  await container.shutdown();
  server.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
