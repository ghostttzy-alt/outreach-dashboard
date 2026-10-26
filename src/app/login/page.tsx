"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
    } else {
      setError("Wrong password");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
            <Lock className="size-4" />
          </span>
          <h1 className="text-lg font-semibold">Sign in</h1>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoFocus aria-label="Password" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={busy || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
