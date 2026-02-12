import {
  Home,
  Database,
  Zap,
  Layers,
  Key,
  Shield,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

// Route path constants
export const ROUTES = {
  // Auth routes
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  // App routes
  OVERVIEW: "/",
  COLLECTIONS: "/collections",
  COLLECTION_DETAIL: "/collections/:slug",
  COMPOSITION_BUILDER: "/collections/:slug/composition/create",
  COMPOSITION_EDITOR: "/collections/:slug/composition/:compositionSlug/edit",
  APIS: "/apis",
  COMPOSITIONS: "/compositions",
  COMPOSITION_DETAIL: "/compositions/:slug",
  API_KEYS: "/api-keys",
  ACCESS_RULES: "/access-rules",
  SETTINGS: "/settings",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

// Helper to generate dynamic routes
export const routes = {
  // Auth
  login: () => ROUTES.LOGIN,
  register: () => ROUTES.REGISTER,
  forgotPassword: () => ROUTES.FORGOT_PASSWORD,
  resetPassword: (token?: string) =>
    token ? `${ROUTES.RESET_PASSWORD}?token=${token}` : ROUTES.RESET_PASSWORD,
  // App
  overview: () => ROUTES.OVERVIEW,
  collections: () => ROUTES.COLLECTIONS,
  collectionDetail: (slug: string) => `/collections/${slug}`,
  compositionBuilder: (collectionSlug: string) =>
    `/collections/${collectionSlug}/composition/create`,
  compositionEditor: (collectionSlug: string, compositionSlug: string) =>
    `/collections/${collectionSlug}/composition/${compositionSlug}/edit`,
  apis: () => ROUTES.APIS,
  compositions: () => ROUTES.COMPOSITIONS,
  compositionDetail: (slug: string) => `/compositions/${slug}`,
  apiKeys: () => ROUTES.API_KEYS,
  accessRules: () => ROUTES.ACCESS_RULES,
  settings: () => ROUTES.SETTINGS,
};

// Lazy component type for react-router
type LazyComponent = () => Promise<{ default: ComponentType }>;

// Route configuration
export interface RouteConfig {
  key: string;
  path: string;
  label: string;
  icon?: LucideIcon;
  parent?: string; // Key of parent route for breadcrumbs
  section?: "platform" | "security" | "other";
  showInNav?: boolean;
  navCount?: number; // Dynamic count shown in nav
  lazy?: LazyComponent; // Lazy loaded component
  permissions?: string[]; // Required permissions (e.g., ["collections.read"])
  index?: boolean; // Is this an index route
}

// Auth routes config (separate from app routes)
export const authRouteConfig: Record<string, RouteConfig> = {
  login: {
    key: "login",
    path: ROUTES.LOGIN,
    label: "Login",
    lazy: () => import("@/pages/auth/login"),
  },
  register: {
    key: "register",
    path: ROUTES.REGISTER,
    label: "Register",
    lazy: () => import("@/pages/auth/register"),
  },
  forgotPassword: {
    key: "forgotPassword",
    path: ROUTES.FORGOT_PASSWORD,
    label: "Forgot Password",
    lazy: () => import("@/pages/auth/forgot-password"),
  },
  resetPassword: {
    key: "resetPassword",
    path: ROUTES.RESET_PASSWORD,
    label: "Reset Password",
    lazy: () => import("@/pages/auth/reset-password"),
  },
};

// App routes config (protected)
export const routeConfig: Record<string, RouteConfig> = {
  overview: {
    key: "overview",
    path: ROUTES.OVERVIEW,
    label: "Overview",
    icon: Home,
    section: "platform",
    showInNav: true,
    index: true,
    lazy: () => import("@/pages/overview"),
  },
  collections: {
    key: "collections",
    path: ROUTES.COLLECTIONS,
    label: "Collections",
    icon: Database,
    section: "platform",
    showInNav: true,
    navCount: 5, // TODO: Make dynamic
    lazy: () => import("@/pages/collections"),
    permissions: ["collections.read"],
  },
  collectionDetail: {
    key: "collectionDetail",
    path: ROUTES.COLLECTION_DETAIL,
    label: "Collection",
    parent: "collections",
    lazy: () => import("@/pages/collection-detail"),
    permissions: ["collections.read"],
  },
  compositionBuilder: {
    key: "compositionBuilder",
    path: ROUTES.COMPOSITION_BUILDER,
    label: "Create API",
    parent: "collectionDetail",
    lazy: () => import("@/pages/composition-builder"),
    permissions: ["compositions.write"],
  },
  compositionEditor: {
    key: "compositionEditor",
    path: ROUTES.COMPOSITION_EDITOR,
    label: "Edit API",
    parent: "collectionDetail",
    lazy: () => import("@/pages/composition-builder"),
    permissions: ["compositions.write"],
  },
  apis: {
    key: "apis",
    path: ROUTES.APIS,
    label: "APIs",
    icon: Zap,
    section: "platform",
    showInNav: true,
    navCount: 6, // TODO: Make dynamic
    lazy: () => import("@/pages/apis"),
    permissions: ["apis.read"],
  },
  compositions: {
    key: "compositions",
    path: ROUTES.COMPOSITIONS,
    label: "Compositions",
    icon: Layers,
    section: "platform",
    showInNav: true,
    lazy: () => import("@/pages/compositions"),
    permissions: ["compositions.read"],
  },
  compositionDetail: {
    key: "compositionDetail",
    path: ROUTES.COMPOSITION_DETAIL,
    label: "Composition",
    parent: "compositions",
    lazy: () => import("@/pages/compositions/[slug]"),
    permissions: ["compositions.read"],
  },
  apiKeys: {
    key: "apiKeys",
    path: ROUTES.API_KEYS,
    label: "API Keys",
    icon: Key,
    section: "security",
    showInNav: true,
    lazy: () => import("@/pages/api-keys"),
    permissions: ["api-keys.read"],
  },
  accessRules: {
    key: "accessRules",
    path: ROUTES.ACCESS_RULES,
    label: "Access Rules",
    icon: Shield,
    section: "security",
    showInNav: true,
    lazy: () => import("@/pages/access-rules"),
    permissions: ["access-rules.read"],
  },
  settings: {
    key: "settings",
    path: ROUTES.SETTINGS,
    label: "Settings",
    icon: Settings,
    section: "other",
    showInNav: true,
    lazy: () => import("@/pages/settings"),
  },
};

// Get navigation items grouped by section
export function getNavItems() {
  const sections = [
    { key: "platform", label: "Platform" },
    { key: "security", label: "Security" },
    { key: "other", label: null },
  ] as const;

  return sections.map((section) => ({
    section: section.label,
    items: Object.values(routeConfig)
      .filter((r) => r.showInNav && r.section === section.key)
      .map((r) => ({
        key: r.path,
        label: r.label,
        icon: r.icon!,
        count: r.navCount,
      })),
  }));
}

// Build breadcrumbs from current path
export function getBreadcrumbs(
  pathname: string,
  params?: Record<string, string>,
): Array<{ label: string; path?: string }> {
  // Find matching route config
  const matchedRoute = Object.values(routeConfig).find((r) => {
    // Convert route path to regex pattern
    const pattern = r.path.replace(/:[^/]+/g, "[^/]+");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(pathname);
  });

  if (!matchedRoute) {
    return [{ label: "Page" }];
  }

  const breadcrumbs: Array<{ label: string; path?: string }> = [];

  // Build breadcrumb chain from parent to current
  let current: RouteConfig | undefined = matchedRoute;
  const chain: RouteConfig[] = [];

  while (current) {
    chain.unshift(current);
    current = current.parent ? routeConfig[current.parent] : undefined;
  }

  // Convert chain to breadcrumb items
  chain.forEach((route, index) => {
    const isLast = index === chain.length - 1;
    let label = route.label;

    // For detail pages, try to use the slug/name from params
    if (route.path.includes(":slug") && params?.slug) {
      label = params.slug;
    }

    breadcrumbs.push({
      label,
      path: isLast
        ? undefined
        : route.path.replace(/:slug/g, params?.slug || ""),
    });
  });

  return breadcrumbs;
}

// Route factory types
export interface AppRoute {
  path: string;
  lazy: LazyComponent;
  index?: boolean;
}

export interface RouteFactoryOptions {
  permissions?: string[];
  hasPermission?: (permission: string) => boolean;
}

// Create routes array for react-router
export function createAppRoutes(options?: RouteFactoryOptions): AppRoute[] {
  const { permissions, hasPermission } = options ?? {};

  return Object.values(routeConfig)
    .filter((route) => {
      // Skip routes without lazy loader
      if (!route.lazy) return false;

      // If no permission check function provided, include all routes
      if (!hasPermission) return true;

      // If route has no permissions required, include it
      if (!route.permissions || route.permissions.length === 0) return true;

      // Check if user has all required permissions
      if (permissions) {
        return route.permissions.every((p) => permissions.includes(p));
      }

      // Check with hasPermission function
      return route.permissions.every((p) => hasPermission(p));
    })
    .map((route) => ({
      path: route.path,
      lazy: route.lazy!,
      index: route.index,
    }));
}

// Get route config by path
export function getRouteByPath(path: string): RouteConfig | undefined {
  return Object.values(routeConfig).find((r) => r.path === path);
}

// Get route config by key
export function getRouteByKey(key: string): RouteConfig | undefined {
  return routeConfig[key];
}

// Create auth routes array for react-router
export function createAuthRoutes(): AppRoute[] {
  return Object.values(authRouteConfig)
    .filter((route) => route.lazy)
    .map((route) => ({
      path: route.path,
      lazy: route.lazy!,
      index: route.index,
    }));
}
