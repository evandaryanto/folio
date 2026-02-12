import { Container } from "./container";

let container: Container;

/**
 * Initializes and returns the Hono application instance.
 *
 * This function implements lazy initialization pattern, creating a singleton container
 * only on the first invocation. The container is then reused across subsequent calls,
 * which is particularly useful for AWS Lambda warm invocations to improve performance.
 *
 * @returns The Hono application instance from the container
 */
const initApp = () => {
  // Lazy initialization (reused across warm Lambda invocations)
  if (!container) {
    container = Container.getInstance();
  }

  return container.hono;
};

/**
 * Returns the container instance for accessing services, usecases, etc.
 * Must be called after initApp() has been invoked at least once.
 */
export const getContainer = () => {
  if (!container) {
    container = Container.getInstance();
  }
  return container;
};

export default initApp;
