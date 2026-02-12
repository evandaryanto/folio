import { useMemo } from "react";
import {
  Outlet,
  NavLink,
  useLocation,
  useParams,
  Link,
} from "react-router-dom";
import { Search, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavItems, getBreadcrumbs, ROUTES } from "@/lib/routes";
import { useApp } from "@/providers";
import { useCollections } from "@/hooks/use-collections";
import { useCompositions } from "@/hooks/use-compositions";

export default function AppLayout() {
  const location = useLocation();
  const params = useParams<{ slug?: string }>();
  const { user, logout } = useApp();
  const { data: collections } = useCollections();
  const { data: compositions } = useCompositions();

  // Build nav sections with real counts
  const navSections = useMemo(() => {
    const baseNav = getNavItems();
    return baseNav.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        // Override counts with real data
        if (item.key === ROUTES.COLLECTIONS && collections) {
          return { ...item, count: collections.length };
        }
        if (item.key === ROUTES.APIS && compositions) {
          return { ...item, count: compositions.length };
        }
        if (item.key === ROUTES.COMPOSITIONS && compositions) {
          return { ...item, count: compositions.length };
        }
        return item;
      }),
    }));
  }, [collections, compositions]);

  const breadcrumbs = getBreadcrumbs(
    location.pathname,
    params as Record<string, string>,
  );

  // Get workspace initial
  const workspaceInitial = user?.workspaceName?.charAt(0).toUpperCase() || "W";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground text-[13px]">
      {/* Sidebar */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col border-r border-border">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5">
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-br from-primary to-[#A29BFE] bg-clip-text text-transparent">
            Folio
          </h1>
          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            v1
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          {navSections.map((group, idx) => (
            <div key={idx} className="px-2 mb-1">
              {group.section && (
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 pt-3 pb-1.5">
                  {group.section}
                </div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.key}
                  end={item.key === ROUTES.OVERVIEW}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md cursor-pointer transition-all duration-150",
                      "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      isActive && "bg-primary/10 text-primary",
                    )
                  }
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className="ml-auto text-[11px] font-mono text-muted-foreground">
                      {item.count}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Workspace */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[#A29BFE] flex items-center justify-center text-white font-bold text-[13px]">
              {workspaceInitial}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-semibold truncate">
                {user?.workspaceName || "Workspace"}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {user?.email}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-[52px] flex-shrink-0 flex items-center px-5 gap-3 border-b border-border">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {breadcrumbs.map((crumb, i, arr) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
                {crumb.path ? (
                  <Link
                    to={crumb.path}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      i === arr.length - 1 && "text-foreground font-semibold",
                    )}
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-muted-foreground text-xs font-medium hover:border-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
