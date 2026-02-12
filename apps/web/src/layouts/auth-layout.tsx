import { Outlet, Link } from "react-router-dom";
import { routes } from "@/lib/routes";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="h-14 flex items-center px-6 border-b border-border">
        <Link to={routes.login()} className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-br from-primary to-[#A29BFE] bg-clip-text text-transparent">
            Folio
          </h1>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t border-border">
        <p>&copy; {new Date().getFullYear()} Folio. All rights reserved.</p>
      </footer>
    </div>
  );
}
