# React Project Architecture Guide

> A technical breakdown of the libraries, stack, and patterns used in this React + TypeScript project.

---

## Tech Stack Overview

### Core

| Library | Version | What it does |
|---------|---------|--------------|
| React | 19.x | UI framework with concurrent rendering |
| TypeScript | 5.8.x | Type-safe JavaScript |
| Vite | 7.x | Build tool and dev server |

### Styling

| Library | What it does |
|---------|--------------|
| Tailwind CSS | Utility-first CSS framework |
| shadcn/ui | Pre-built components using Radix UI |
| Radix UI | Accessible, unstyled UI primitives |
| Lucide React | Icon library |
| class-variance-authority | Type-safe variant styling |
| clsx + tailwind-merge | Conditional class merging |

### Routing

| Library | What it does |
|---------|--------------|
| React Router | Client-side routing (v7) |

### State Management

| Library | What it does |
|---------|--------------|
| Zustand | Lightweight global state |
| React Query | Server state, caching, async data |

### Forms & Validation

| Library | What it does |
|---------|--------------|
| React Hook Form | Performant form handling |
| Zod | Schema validation |
| @hookform/resolvers | Connect Zod to React Hook Form |

### Visualization

| Library | What it does |
|---------|--------------|
| @xyflow/react | Interactive node-based diagrams |
| @microlink/react-json-view | JSON viewer component |

---

## Project Structure

```
src/
├── main.tsx              # App entry point
├── router/               # Route configuration
│   └── index.tsx
│
├── pages/                # Route-level pages
│   ├── landing/
│   ├── create-contract/
│   ├── playground/[id]/
│   └── explorer/
│       ├── accounts/
│       ├── transactions/
│       └── router/
│
├── providers/            # Context providers
├── hooks/                # Custom hooks
├── components/
│   └── ui/               # shadcn/ui components
├── store/                # Zustand stores
├── service/              # Business logic
└── lib/
    ├── constants/
    └── utils/
```

---

## Route Setup

### Installation

```bash
npm install react-router react-router-dom
```

### Basic Configuration

Create your router in `src/router/index.tsx`:

```tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Pages
import Landing from "@/pages/landing";
import CreateContract from "@/pages/create-contract";
import Playground from "@/pages/playground/[id]";
import Explorer from "@/pages/explorer";
import Accounts from "@/pages/explorer/accounts";
import AccountDetail from "@/pages/explorer/accounts/[id]";
import Transactions from "@/pages/explorer/transactions";

// Layouts
import RootLayout from "@/layouts/RootLayout";
import ExplorerLayout from "@/pages/explorer/components/layout";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Landing />,
      },
      {
        path: "/create-contract",
        element: <CreateContract />,
      },
      {
        path: "/playground/:id",
        element: <Playground />,
      },
      {
        path: "/explorer",
        element: <ExplorerLayout />,
        children: [
          {
            index: true,
            element: <Explorer />,
          },
          {
            path: "accounts",
            element: <Accounts />,
          },
          {
            path: "accounts/:id",
            element: <AccountDetail />,
          },
          {
            path: "transactions",
            element: <Transactions />,
          },
        ],
      },
    ],
  },
]);

export default router;
```

### Entry Point

In `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

### Route Patterns

| Pattern | Example | Description |
|---------|---------|-------------|
| Static | `/create-contract` | Fixed path |
| Dynamic | `/playground/:id` | URL parameter |
| Nested | `/explorer/accounts` | Child routes |
| Index | `index: true` | Default child route |

### Accessing Route Params

```tsx
import { useParams } from "react-router-dom";

function Playground() {
  const { id } = useParams<{ id: string }>();
  // id = "123" for /playground/123
}
```

### Navigation

```tsx
import { useNavigate, Link } from "react-router-dom";

// Programmatic
const navigate = useNavigate();
navigate("/playground/1");
navigate(-1); // Go back

// Declarative
<Link to="/explorer">Go to Explorer</Link>
```

### Layout with Outlet

```tsx
import { Outlet } from "react-router-dom";

function ExplorerLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  );
}
```

---

## State Management Setup

### Zustand Store

```bash
npm install zustand
```

Create a store in `src/store/app/index.ts`:

```tsx
import { create } from "zustand";

interface AppState {
  count: number;
  increment: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

Usage:

```tsx
function Counter() {
  const { count, increment } = useAppStore();
  return <button onClick={increment}>{count}</button>;
}
```

### React Query Setup

```bash
npm install @tanstack/react-query
```

Wrap your app:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

Usage:

```tsx
import { useQuery } from "@tanstack/react-query";

function Accounts() {
  const { data, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });
}
```

---

## Form Setup

### React Hook Form + Zod

```bash
npm install react-hook-form zod @hookform/resolvers
```

Define schema:

```tsx
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address"),
  amount: z.coerce.number().positive(),
});

type FormData = z.infer<typeof formSchema>;
```

Use in component:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", address: "", amount: 0 },
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("name")} />
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## UI Components (shadcn/ui)

### Installation

```bash
npx shadcn@latest init
npx shadcn@latest add button card input dialog
```

### Usage

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter value" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Available Components

- Layout: `sidebar`, `breadcrumb`, `separator`
- Forms: `input`, `textarea`, `label`, `form`, `select`
- Display: `badge`, `card`, `accordion`, `collapsible`, `alert`
- Overlay: `dialog`, `popover`, `tooltip`, `sheet`
- Feedback: `skeleton`, `sonner` (toasts)

---

## Custom Hooks Pattern

### Provider Hook

```tsx
// src/hooks/use-app.ts
import { useContext } from "react";
import { AppProviderContext } from "@/providers/AppProvider";

export function useApp() {
  const context = useContext(AppProviderContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
```

### Data Fetching Hook

```tsx
// src/hooks/use-accounts.ts
import { useQuery } from "@tanstack/react-query";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => fetchAccounts(),
  });
}
```

### Responsive Hook

```tsx
// src/hooks/use-mobile.ts
import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
```

---

## Context Providers

### Provider Pattern

```tsx
// src/providers/AppProvider/index.tsx
import { createContext, useEffect, useState, ReactNode } from "react";

interface AppProviderValue {
  isReady: boolean;
}

export const AppProviderContext = createContext<AppProviderValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize services
    initializeServices().then(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <AppProviderContext.Provider value={{ isReady }}>
      {children}
    </AppProviderContext.Provider>
  );
}
```

### Nesting Providers

```tsx
// src/main.tsx
<AppProvider>
  <PlaygroundProvider>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </PlaygroundProvider>
</AppProvider>
```

---

## Utility Functions

### Class Name Merging

```tsx
// src/lib/utils/styles.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn("p-4", isActive && "bg-blue-500", className)} />
```

### Constants

```tsx
// src/lib/constants/query-key.ts
export const QUERY_KEYS = {
  PLAYGROUNDS: "playgrounds",
  ACCOUNTS: "accounts",
  TRANSACTIONS: "transactions",
} as const;
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Button.tsx` |
| Hooks | camelCase with `use-` prefix | `use-app.ts` |
| Utilities | camelCase | `formatAddress.ts` |
| Constants | camelCase file, UPPER_CASE values | `query-key.ts` |
| Types | PascalCase | `types.ts` |
| Pages | kebab-case folders | `create-contract/` |
| Dynamic routes | `[param]` folder | `[id]/` |

---

## Summary

This stack provides:

- **Type safety** — TypeScript + Zod
- **Performance** — Vite + React 19 + Zustand
- **Developer experience** — Hot reload, strict types, clear patterns
- **Maintainability** — Feature-based organization, custom hooks, provider pattern
