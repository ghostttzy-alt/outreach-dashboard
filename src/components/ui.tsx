"use client";

import { forwardRef, useEffect } from "react";
import { X, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-8 px-2.5 text-xs",
        size === "md" && "h-9 px-3.5 text-sm",
        size === "icon" && "size-9",
        variant === "primary" && "bg-accent text-accent-fg shadow-sm hover:brightness-110",
        variant === "secondary" && "border border-border bg-panel hover:border-border-strong hover:bg-panel-2",
        variant === "ghost" && "text-muted hover:bg-panel-2 hover:text-fg",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-500",
        className,
      )}
      {...props}
    />
  );
});

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-border bg-panel", className)} {...props} />;
}

export function CardHeader({ title, description, action, className }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const inputBase =
  "w-full rounded-lg border border-border bg-panel px-3 text-sm text-fg placeholder:text-muted/70 transition-colors hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputBase, "h-9", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(inputBase, "min-h-24 py-2 leading-relaxed", className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={cn(inputBase, "h-9 pr-8", className)} {...props} />;
});

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("mb-1.5 block text-xs font-medium text-muted", className)}>{children}</span>;
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <Label>{label}</Label>
      {children}
    </label>
  );
}

export function Modal({
  open, onClose, title, children, size = "md",
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          "relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-panel p-5 shadow-2xl sm:rounded-2xl",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-lg",
          size === "lg" && "sm:max-w-2xl",
          size === "xl" && "sm:max-w-5xl",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="-mr-2 size-8">
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

const STAGE_STYLES: Record<string, string> = {
  Queued: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300",
  Contacted: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  "Follow-up 1": "bg-blue-500/10 text-blue-700 ring-blue-500/25 dark:text-blue-300",
  "Follow-up 2": "bg-indigo-500/10 text-indigo-700 ring-indigo-500/25 dark:text-indigo-300",
  Replied: "bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  Interested: "bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  "Mockup Sent": "bg-fuchsia-500/10 text-fuchsia-700 ring-fuchsia-500/25 dark:text-fuchsia-300",
  Won: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  Lost: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300",
  Cold: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-400",
  "Do Not Contact": "bg-red-600 text-white ring-red-600",
};

export const STAGE_DOT: Record<string, string> = {
  Queued: "bg-zinc-400", Contacted: "bg-sky-500", "Follow-up 1": "bg-blue-500", "Follow-up 2": "bg-indigo-500",
  Replied: "bg-violet-500", Interested: "bg-amber-500", "Mockup Sent": "bg-fuchsia-500", Won: "bg-emerald-500",
  Lost: "bg-rose-500", Cold: "bg-slate-500", "Do Not Contact": "bg-red-600",
};

const WEBSITE_STYLES: Record<string, string> = {
  None: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-300",
  Broken: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300",
  "Not Mobile": "bg-orange-500/10 text-orange-700 ring-orange-500/25 dark:text-orange-300",
  Outdated: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  "No HTTPS": "bg-yellow-500/10 text-yellow-700 ring-yellow-500/30 dark:text-yellow-300",
  OK: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
};

const GENERIC_STYLES: Record<string, string> = {
  gray: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300",
  green: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  blue: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  amber: "bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  red: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-300",
  violet: "bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  fuchsia: "bg-fuchsia-500/10 text-fuchsia-700 ring-fuchsia-500/25 dark:text-fuchsia-300",
};

export function Badge({ color = "gray", className, children }: { color?: keyof typeof GENERIC_STYLES | string; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset", GENERIC_STYLES[color] ?? GENERIC_STYLES.gray, className)}>
      {children}
    </span>
  );
}

export function StageBadge({ stage, className }: { stage: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset", STAGE_STYLES[stage] ?? STAGE_STYLES.Queued, className)}>
      {stage === "Do Not Contact" && <Ban className="size-3" />}
      {stage}
    </span>
  );
}

export function WebsiteBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset", WEBSITE_STYLES[status] ?? WEBSITE_STYLES.OK)}>
      {status === "None" ? "No site" : status}
    </span>
  );
}

const EMAIL_STATUS_COLOR: Record<string, string> = {
  draft: "gray", sent: "blue", opened: "violet", replied: "green", bounced: "red", unsubscribed: "red",
};
export function EmailStatusBadge({ status }: { status: string }) {
  return <Badge color={EMAIL_STATUS_COLOR[status] ?? "gray"} className="capitalize">{status}</Badge>;
}

export function Score({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Score ${value} of 5`} title={`Score ${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("h-3 w-1.5 rounded-sm", i <= value ? "bg-accent" : "bg-border-strong")} />
      ))}
    </span>
  );
}

export function EmptyState({ icon, title, children }: { icon?: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

/** Small JSON fetch helper for client components. Throws with the API's error message. */
export async function api<T = unknown>(url: string, init?: Omit<RequestInit, "body"> & { body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body !== undefined ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}
