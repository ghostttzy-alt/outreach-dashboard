"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { StageBadge } from "./ui";

type Hit = { id: string; businessName: string; city: string; niche: string; stage: string };

/** Top-bar search: live results for leads; Enter opens the full filtered Leads table. */
export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !/input|textarea|select/i.test((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/leads?q=${encodeURIComponent(q)}&pageSize=6&sort=businessName&order=asc`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((j) => {
          setHits(j.data ?? []);
          setActive(0);
        })
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    router.push(href);
  };

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, hits.length));
          if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          if (e.key === "Escape") inputRef.current?.blur();
          if (e.key === "Enter" && q.trim()) {
            if (active < hits.length && hits[active]) go(`/leads/${hits[active].id}`);
            else go(`/leads?q=${encodeURIComponent(q.trim())}`);
          }
        }}
        placeholder="Search leads, cities, niches…"
        className="h-9 w-full rounded-lg border border-border bg-panel pl-9 pr-12 text-sm placeholder:text-muted/70 transition-colors hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        aria-label="Search leads"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 text-[10px] text-muted sm:block">
        ⌘K
      </kbd>
      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
          {hits.map((h, i) => (
            <Link
              key={h.id}
              href={`/leads/${h.id}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(`/leads/${h.id}`)}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 text-sm ${i === active ? "bg-panel-2" : ""}`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{h.businessName}</span>
                <span className="block truncate text-xs text-muted">
                  {h.niche} · {h.city}
                </span>
              </span>
              <StageBadge stage={h.stage} />
            </Link>
          ))}
          <button
            onMouseEnter={() => setActive(hits.length)}
            onClick={() => go(`/leads?q=${encodeURIComponent(q.trim())}`)}
            className={`flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm text-muted ${active === hits.length ? "bg-panel-2 text-fg" : ""}`}
          >
            <Search className="size-3.5" /> See all results for “{q.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}
