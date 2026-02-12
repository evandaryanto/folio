import { createBrowserRouter } from "react-router-dom";
import RootLayout from "@/layouts/root-layout";
import AppLayout from "@/layouts/app-layout";
import AuthLayout from "@/layouts/auth-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { createAppRoutes, createAuthRoutes } from "@/lib/routes";

// Get routes from factory (can be filtered by permissions later)
const appRoutes = createAppRoutes();
const authRoutes = createAuthRoutes();

// Transform routes for react-router's lazy loading format
function transformRoutes(routes: ReturnType<typeof createAppRoutes>) {
  return routes.map((route) => ({
    path: route.path,
    lazy: async () => {
      const module = await route.lazy();
      return { Component: module.default };
    },
    errorElement: <ErrorBoundary />,
  }));
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      // Auth routes (public)
      {
        element: <AuthLayout />,
        errorElement: <ErrorBoundary />,
        children: transformRoutes(authRoutes),
      },
      // App routes (protected)
      {
        element: <AppLayout />,
        errorElement: <ErrorBoundary />,
        children: transformRoutes(appRoutes),
      },
    ],
  },
]);

export default router;
