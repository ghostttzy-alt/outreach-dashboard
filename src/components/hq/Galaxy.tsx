"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export type AgentMode = "auto" | "autopilot" | "you";

export type Department = {
  key: string;
  name: string;
  color: string;
  href?: string;
  status: string;
  agents: { name: string; mode: AgentMode; job: string }[];
  stats: { label: string; value: string }[];
  claudeTasks: string[];
  myTasks: string[];
  recent: { note: string; at: string }[];
  activity: number; // 0..1, how busy the department is
};

const MODE_COLOR: Record<AgentMode, string> = { auto: "#3ddc97", autopilot: "#7aa7ff", you: "#f5a524" };
const MODE_LABEL: Record<AgentMode, string> = {
  auto: "Runs on its own",
  autopilot: "Claude autopilot",
  you: "Needs you",
};

type Star = { x: number; y: number; r: number; tw: number; sp: number };
type Dust = { a: number; r: number; sp: number; size: number; color: string; wob: number };
type Pulse = { dept: number; t: number; sp: number; out: boolean };
type Point = { x: number; y: number };

function hexToRgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export default function Galaxy({ departments, hud }: { departments: Department[]; hud: { label: string; value: string }[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const hoverRef = useRef<number>(-1);
  const deptPos = useRef<Point[]>([]);
  const [clock, setClock] = useState("");

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let dust: Dust[] = [];
    const pulses: Pulse[] = [];
    const n = departments.length;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap.clientWidth;
      h = w < 640 ? Math.max(480, w * 1.25) : Math.max(460, Math.min(720, w * 0.62));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = (w * h) / 2500;
      stars = Array.from({ length: Math.round(area) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.2,
        tw: Math.random() * Math.PI * 2,
        sp: 0.5 + Math.random() * 1.5,
      }));
      const ring = Math.min(w * 0.34, h * 0.42);
      dust = Array.from({ length: Math.round(Math.min(1800, area * 4.5)) }, () => {
        const d = departments[Math.floor(Math.random() * n)];
        const r = Math.pow(Math.random(), 1.4) * ring * 0.9 + 10;
        return {
          a: Math.random() * Math.PI * 2,
          r,
          sp: (0.04 + Math.random() * 0.08) * (60 / (r + 40)),
          size: Math.random() * 1.6 + 0.3,
          color: Math.random() < 0.55 ? d.color : "#ffffff",
          wob: Math.random() * Math.PI * 2,
        };
      });
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    let time = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += reduceMotion ? 0 : dt;
      const cx = w / 2;
      const cy = h / 2;
      const rx = Math.min(w * 0.34, h * 0.42);
      const ry = Math.min(h * 0.34, w * 0.5);
      const squash = ry / rx;
      const sel = selectedRef.current;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // Stars
      for (const s of stars) {
        const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(s.tw + time * s.sp));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Department positions on a slowly turning ring
      const pos: Point[] = departments.map((_, i) => {
        const ang = -Math.PI / 2 + (i / n) * Math.PI * 2 + time * 0.02;
        return { x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry };
      });
      deptPos.current = pos;

      // Dust swirl around the core
      ctx.globalCompositeOperation = "lighter";
      for (const p of dust) {
        p.a += p.sp * dt;
        const r = p.r + Math.sin(time * 0.6 + p.wob) * 3;
        const x = cx + Math.cos(p.a) * r;
        const y = cy + Math.sin(p.a) * r * squash;
        ctx.fillStyle = hexToRgba(p.color, 0.3 + 0.4 * (1 - Math.min(1, r / rx)));
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Links from core to departments
      departments.forEach((d, i) => {
        const dim = sel && sel !== d.key ? 0.06 : 0.22;
        const g = ctx.createLinearGradient(cx, cy, pos[i].x, pos[i].y);
        g.addColorStop(0, `rgba(255,255,255,${dim})`);
        g.addColorStop(1, hexToRgba(d.color, dim * 2));
        ctx.strokeStyle = g;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(pos[i].x, pos[i].y);
        ctx.stroke();
      });

      // Light pulses travelling along the links: work going out, results coming back
      if (!reduceMotion && Math.random() < 0.12 + 0.2 * (departments.reduce((s, d) => s + d.activity, 0) / n)) {
        const dept = Math.floor(Math.random() * n);
        pulses.push({ dept, t: 0, sp: 0.35 + Math.random() * 0.4, out: Math.random() < 0.6 });
      }
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k];
        p.t += p.sp * dt;
        if (p.t >= 1) {
          pulses.splice(k, 1);
          continue;
        }
        const t = p.out ? p.t : 1 - p.t;
        const x = cx + (pos[p.dept].x - cx) * t;
        const y = cy + (pos[p.dept].y - cy) * t;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 7);
        glow.addColorStop(0, hexToRgba(departments[p.dept].color, 0.9));
        glow.addColorStop(1, hexToRgba(departments[p.dept].color, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core
      const pulse = 1 + 0.06 * Math.sin(time * 1.6);
      const coreR = Math.max(26, Math.min(w, h) * 0.06) * pulse;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.6);
      core.addColorStop(0, "rgba(255,255,255,0.95)");
      core.addColorStop(0.18, "rgba(200,255,230,0.6)");
      core.addColorStop(0.45, "rgba(61,220,151,0.15)");
      core.addColorStop(1, "rgba(61,220,151,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, coreR * 1.3, coreR * 1.3 * 0.8, time * 0.3, 0, Math.PI * 2);
      ctx.stroke();

      // Departments and their orbiting agents
      departments.forEach((d, i) => {
        const { x, y } = pos[i];
        const isSel = sel === d.key;
        const isHover = hoverRef.current === i;
        const faded = sel && !isSel;
        const base = (w < 640 ? 7 : 9) + d.activity * 5;
        const r = base * (isSel || isHover ? 1.35 : 1);
        const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        halo.addColorStop(0, hexToRgba(d.color, faded ? 0.15 : 0.55));
        halo.addColorStop(1, hexToRgba(d.color, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = faded ? hexToRgba(d.color, 0.4) : d.color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        const orbit = r + 16;
        d.agents.forEach((a, j) => {
          const ang = time * (0.5 + j * 0.07) + (j / d.agents.length) * Math.PI * 2;
          const ax = x + Math.cos(ang) * orbit;
          const ay = y + Math.sin(ang) * orbit * 0.8;
          ctx.fillStyle = hexToRgba(MODE_COLOR[a.mode], faded ? 0.3 : 0.95);
          ctx.beginPath();
          ctx.arc(ax, ay, 2.4, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.globalCompositeOperation = "source-over";
        ctx.font = "600 11px Geist, Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = faded ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.92)";
        ctx.fillText(d.name.toUpperCase(), x, y + orbit + 16);
        ctx.font = "10px Geist, Inter, system-ui, sans-serif";
        ctx.fillStyle = faded ? "rgba(138,138,138,0.4)" : "rgba(138,138,138,0.95)";
        ctx.fillText(`${d.agents.length} agents · ${d.status}`, x, y + orbit + 29);
        ctx.globalCompositeOperation = "lighter";
      });

      ctx.globalCompositeOperation = "source-over";
      ctx.font = "600 10px Geist, Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText("KNOWLEDGE CORE", cx, cy + coreR * 1.3 + 14);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const hit = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let best = -1;
      let bestD = 40 * 40;
      deptPos.current.forEach((p, i) => {
        const d2 = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d2 < bestD) {
          bestD = d2;
          best = i;
        }
      });
      return best;
    };
    const onMove = (e: PointerEvent) => {
      hoverRef.current = hit(e);
      canvas.style.cursor = hoverRef.current >= 0 ? "pointer" : "default";
    };
    const onClick = (e: PointerEvent) => {
      const i = hit(e);
      setSelected(i >= 0 ? departments[i].key : null);
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onClick);
    };
  }, [departments]);

  const dept = departments.find((d) => d.key === selected);
  const agentTotal = departments.reduce((s, d) => s + d.agents.length, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div ref={wrapRef} className="relative overflow-hidden rounded-xl border border-[#1f1f1f] bg-black">
        <canvas ref={canvasRef} className="block w-full" aria-label="Live map of your business departments and agents" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-[10px] tracking-widest text-[#8a8a8a] uppercase">
          <span className="flex items-center gap-1.5 text-white">
            <span className="size-1.5 animate-pulse rounded-full bg-[#3ddc97]" /> Live · {clock}
          </span>
          <span>
            {departments.length} departments · {agentTotal} agents
          </span>
          {hud.map((s) => (
            <span key={s.label}>
              {s.label} <span className="text-white">{s.value}</span>
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-[10px] text-[#8a8a8a]">
          {(Object.keys(MODE_LABEL) as AgentMode[]).map((m) => (
            <span key={m} className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ background: MODE_COLOR[m] }} />
              {MODE_LABEL[m]}
            </span>
          ))}
        </div>
      </div>

      <aside className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
        {!dept ? (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">How it works</h2>
            <p className="text-sm text-[#8a8a8a]">
              Every department is a team of agents around one shared knowledge core: the playbook Claude reads before
              each round and updates after.
            </p>
            <ul className="space-y-2">
              {departments.map((d) => (
                <li key={d.key}>
                  <button
                    onClick={() => setSelected(d.key)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#1f1f1f] px-3 py-2 text-left text-sm transition-colors hover:border-[#2a2a2a]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="text-xs text-[#8a8a8a]">{d.agents.length} agents</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: dept.color }} />
                  <h2 className="text-lg font-semibold">{dept.name}</h2>
                </div>
                <p className="mt-0.5 text-xs text-[#8a8a8a]">{dept.status}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs text-[#8a8a8a] hover:text-white">
                Close
              </button>
            </div>

            {dept.stats.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {dept.stats.map((s) => (
                  <div key={s.label} className="rounded-lg border border-[#1f1f1f] bg-black px-3 py-2">
                    <div className="text-lg font-bold">{s.value}</div>
                    <div className="text-[11px] text-[#8a8a8a]">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h3 className="mb-2 text-xs font-semibold tracking-widest text-[#8a8a8a] uppercase">Agents</h3>
              <ul className="space-y-2">
                {dept.agents.map((a) => (
                  <li key={a.name} className="rounded-lg border border-[#1f1f1f] px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{a.name}</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-[#8a8a8a]">
                        <span className="size-1.5 rounded-full" style={{ background: MODE_COLOR[a.mode] }} />
                        {MODE_LABEL[a.mode]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#8a8a8a]">{a.job}</p>
                  </li>
                ))}
              </ul>
            </div>

            {dept.myTasks.length > 0 && (
              <TaskList title="Waiting on you" items={dept.myTasks} dot="#f5a524" />
            )}
            {dept.claudeTasks.length > 0 && (
              <TaskList title="Claude is working on" items={dept.claudeTasks} dot="#7aa7ff" />
            )}

            {dept.recent.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold tracking-widest text-[#8a8a8a] uppercase">Latest</h3>
                <ul className="space-y-2">
                  {dept.recent.map((r, i) => (
                    <li key={i} className="text-sm">
                      {r.note}
                      <span className="block text-[11px] text-[#8a8a8a]">
                        {formatDistanceToNow(new Date(r.at), { addSuffix: true })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dept.href && (
              <Link href={dept.href} className="inline-block text-xs text-[#3ddc97] hover:underline">
                Open {dept.name} →
              </Link>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function TaskList({ title, items, dot }: { title: string; items: string[]; dot: string }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold tracking-widest text-[#8a8a8a] uppercase">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: dot }} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
