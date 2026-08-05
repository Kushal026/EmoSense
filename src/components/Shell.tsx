import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, Home, Info, ScanFace } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/live", label: "Live Detection", icon: Camera },
  { to: "/about", label: "About", icon: Info },
] as const;

/** App shell: fixed left sidebar + scrollable main area. */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
            <ScanFace className="size-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-lg leading-none font-bold">EmoSense</p>
            <p className="mt-1 text-[11px] tracking-wide text-muted-foreground uppercase">
              
            </p>
          </div>
        </div>

        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("size-4 transition-colors", active && "text-accent")} />
                {label}
              </Link>
            );
          })}
        </nav>

       
      </aside>

      <main className="min-w-0 flex-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                pathname === to
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
