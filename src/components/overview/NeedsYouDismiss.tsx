"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button, api } from "@/components/ui";

export function NeedsYouDismiss({ id }: { id: string }) {
  const router = useRouter();
  return (
    <Button size="sm" variant="ghost" onClick={async () => { await api(`/api/replies/${id}`, { method: "PATCH", body: { needsYou: false } }); router.refresh(); }}>
      <Check className="size-3.5" /> Done
    </Button>
  );
}
