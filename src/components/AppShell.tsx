"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bot, Briefcase, CheckSquare, Globe, LayoutDashboard, LogOut, MapPinned, Menu, Send, Settings, Users, X, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/queue", label: "Approval queue", icon: CheckSquare },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/outreach", label: "Outreach", icon: Send },
  { href: "/sites", label: "Sites & mockups", icon: Globe },
  { href: "/clients", label: "Clients", icon: Briefcase },
  { href: "/coverage", label: "Coverage", icon: MapPinned },
  { href: "/runs", label: "Runs", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/hq", label: "HQ", icon: LayoutGrid },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
              active ? "bg-panel-2 font-medium text-fg" : "text-muted hover:bg-panel-2/60 hover:text-fg",
            )}
          >
            <Icon className={cn("size-4", active ? "text-accent" : "")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2.5">
      <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-fg">O</span>
      <span className="text-sm font-semibold tracking-tight">Outreach</span>
    </Link>
  );
}

function SignOut() {
  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };
  return (
    <button onClick={signOut} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors hover:bg-panel-2/60 hover:text-fg">
      <LogOut className="size-4" /> Sign out
    </button>
  );
}

export function AppShell({ children, authEnabled }: { children: React.ReactNode; authEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  if (pathname === "/login") return <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>;

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-panel px-3 py-4 lg:flex">
        <Brand />
        <div className="mt-6 flex-1">
          <NavLinks />
        </div>
        {authEnabled ? <SignOut /> : <p className="px-2.5 text-[11px] text-muted">Local · no sign-in</p>}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-panel px-3 py-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-panel-2" aria-label="Close menu">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-6">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            {authEnabled && <div className="mt-auto"><SignOut /></div>}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-md sm:px-6">
          <button onClick={() => setOpen(true)} className="-ml-1 rounded-lg p-1.5 text-muted hover:bg-panel-2 lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <GlobalSearch />
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
