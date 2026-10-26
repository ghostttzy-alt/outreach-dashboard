"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { Ban } from "lucide-react";
import { STAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { STAGE_DOT, Score, WebsiteBadge, api } from "@/components/ui";
import { useToast } from "@/components/toast";
import type { LeadRow } from "./types";

function LeadCard({ lead, overlay }: { lead: LeadRow; overlay?: boolean }) {
  const dnc = lead.stage === "Do Not Contact";
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-panel p-3 text-sm shadow-sm transition-colors hover:border-border-strong",
        overlay && "rotate-1 shadow-2xl ring-1 ring-accent",
        dnc && "border-red-500/40 bg-red-500/[0.04]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/leads/${lead.id}`} className="font-medium leading-snug hover:underline" onPointerDown={(e) => e.stopPropagation()}>
          {lead.businessName}
        </Link>
        {dnc && <Ban className="mt-0.5 size-3.5 shrink-0 text-red-500" aria-label="Do Not Contact" />}
      </div>
      <p className="mt-0.5 truncate text-xs text-muted">{lead.niche} · {lead.city}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <WebsiteBadge status={lead.websiteStatus} />
        <Score value={lead.score} />
      </div>
    </div>
  );
}

function DraggableCard({ lead }: { lead: LeadRow }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn("cursor-grab touch-manipulation active:cursor-grabbing", isDragging && "opacity-30")}>
      <LeadCard lead={lead} />
    </div>
  );
}

function Column({ stage, leads }: { stage: string; leads: LeadRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div className="flex w-64 shrink-0 flex-col sm:w-72">
      <div className="mb-2 flex items-center gap-2 px-1 text-xs font-medium">
        <span className={cn("size-2 rounded-full", STAGE_DOT[stage])} />
        {stage}
        <span className="text-muted tabular-nums">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-32 flex-1 flex-col gap-2 rounded-xl border border-dashed border-transparent bg-panel-2/50 p-2 transition-colors",
          isOver && "border-accent bg-accent/5",
        )}
      >
        {leads.map((l) => <DraggableCard key={l.id} lead={l} />)}
      </div>
    </div>
  );
}

export function LeadsBoard({ leads, loading, reload }: { leads: LeadRow[]; loading: boolean; reload: () => void }) {
  const toast = useToast();
  const [items, setItems] = useState(leads);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => setItems(leads), [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const stage = e.over?.id as string | undefined;
    const lead = items.find((l) => l.id === e.active.id);
    if (!stage || !lead || lead.stage === stage) return;
    const previous = lead.stage;
    setItems((ls) => ls.map((l) => (l.id === lead.id ? { ...l, stage } : l)));
    try {
      await api(`/api/leads/${lead.id}`, { method: "PATCH", body: { stage } });
      toast(`${lead.businessName} → ${stage}`);
      reload();
    } catch (err) {
      setItems((ls) => ls.map((l) => (l.id === lead.id ? { ...l, stage: previous } : l)));
      toast((err as Error).message, "error");
    }
  };

  const active = items.find((l) => l.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className={cn("-mx-4 overflow-x-auto px-4 pb-4 scrollbar-thin sm:-mx-6 sm:px-6", loading && "opacity-60")}>
        <div className="flex gap-3">
          {STAGES.map((s) => <Column key={s} stage={s} leads={items.filter((l) => l.stage === s)} />)}
        </div>
      </div>
      <DragOverlay>{active ? <LeadCard lead={active} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
