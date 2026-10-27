import Link from "next/link";
import { startOfMonth, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import Galaxy, { type Department, type AgentMode } from "@/components/hq/Galaxy";

export const dynamic = "force-dynamic";

type AgentSpec = { name: string; mode: AgentMode; job: string };

// Each department maps to an HQ venture (by slug) and lists the "agents" that run it:
// "auto" runs on the website by itself, "autopilot" is Claude on the Mac, "you" is Ghosttt.
const DEPARTMENTS: {
  key: string;
  name: string;
  color: string;
  venture?: string;
  agents: AgentSpec[];
}[] = [
  {
    key: "sales",
    name: "Sales",
    color: "#3ddc97",
    venture: "web-design",
    agents: [
      { name: "Lead Finder", mode: "autopilot", job: "Finds local businesses with weak websites and a real email." },
      { name: "Email Writer", mode: "autopilot", job: "Writes and approves short, honest first emails." },
      { name: "Sender", mode: "auto", job: "Sends approved emails every few minutes in business hours." },
      { name: "Follow-up Sender", mode: "auto", job: "Sends follow-ups 4 and 9 days later, stops on any reply." },
      { name: "Reply Watcher", mode: "auto", job: "Checks Gmail every 30 minutes and sorts replies." },
      { name: "Closer", mode: "you", job: "Answers businesses that say yes." },
    ],
  },
  {
    key: "leads",
    name: "Lead Lists",
    color: "#5b9cff",
    venture: "lead-lists",
    agents: [
      { name: "Agency Finder", mode: "autopilot", job: "Finds marketing agencies that buy local leads." },
      { name: "Pitch Writer", mode: "autopilot", job: "Writes the free 10-lead sample offer." },
      { name: "List Exporter", mode: "auto", job: "Builds clean CSV lead lists on demand." },
    ],
  },
  {
    key: "care",
    name: "Client Care",
    color: "#c084fc",
    venture: "admin-addon",
    agents: [
      { name: "Site Updater", mode: "autopilot", job: "Makes hours, menu and price changes for clients." },
      { name: "Review Replier", mode: "autopilot", job: "Drafts replies to client Google reviews." },
      { name: "Monthly Reporter", mode: "autopilot", job: "Writes each client's one-paragraph monthly report." },
    ],
  },
  {
    key: "products",
    name: "Products",
    color: "#f5a524",
    venture: "etsy",
    agents: [
      { name: "Product Designer", mode: "autopilot", job: "Designs printable templates and planners." },
      { name: "Listing Writer", mode: "autopilot", job: "Writes titles, tags and descriptions." },
      { name: "Shop Owner", mode: "you", job: "Opens the shop and adds payout details." },
    ],
  },
  {
    key: "media",
    name: "Media",
    color: "#ff5d73",
    venture: "youtube",
    agents: [
      { name: "Script Writer", mode: "autopilot", job: "Writes 30-45 second Shorts scripts." },
      { name: "Video Maker", mode: "autopilot", job: "Turns scripts into vertical videos." },
      { name: "Uploader", mode: "autopilot", job: "Uploads and schedules about 3 Shorts a day." },
    ],
  },
  {
    key: "finance",
    name: "Finance",
    color: "#2dd4bf",
    agents: [
      { name: "Revenue Tracker", mode: "auto", job: "Adds up this month and monthly recurring income." },
      { name: "Bookkeeper", mode: "you", job: "Logs each payment in HQ → Revenue." },
    ],
  },
  {
    key: "strategy",
    name: "Strategy",
    color: "#fcd34d",
    agents: [
      { name: "Playbook Keeper", mode: "autopilot", job: "Writes down what worked each round, so the next one is smarter." },
      { name: "Idea Tester", mode: "autopilot", job: "Tests new ideas from the 50-idea bank." },
    ],
  },
];

export default async function GalaxyPage() {
  const monthStart = startOfMonth(new Date());
  const weekAgo = subDays(new Date(), 7);

  const [ventures, leadCount, waiting, sentWeek, repliesWeek, monthRevenue, monthly, logs] = await Promise.all([
    prisma.venture.findMany({
      include: {
        tasks: { where: { done: false }, orderBy: { priority: "desc" } },
        items: { select: { type: true } },
        logs: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    }),
    prisma.lead.count(),
    prisma.email.count({ where: { direction: "outbound", status: { in: ["draft", "approved"] } } }),
    prisma.email.count({ where: { direction: "outbound", sentAt: { gte: weekAgo } } }),
    prisma.email.count({ where: { direction: "inbound", sentAt: { gte: weekAgo } } }),
    prisma.revenue.aggregate({ where: { date: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.revenue.aggregate({ where: { isMonthly: true }, _sum: { amount: true } }),
    prisma.hqLog.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  const bySlug = new Map(ventures.map((v) => [v.slug, v]));
  const thisMonth = monthRevenue._sum.amount ?? 0;
  const mrr = monthly._sum.amount ?? 0;
  const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

  const departments: Department[] = DEPARTMENTS.map((d) => {
    const v = d.venture ? bySlug.get(d.venture) : undefined;
    const count = (type: string) => v?.items.filter((i) => i.type === type).length ?? 0;
    let stats: { label: string; value: string }[] = [];
    if (d.key === "sales") {
      stats = [
        { label: "Leads", value: String(leadCount) },
        { label: "Waiting to send", value: String(waiting) },
        { label: "Sent this week", value: String(sentWeek) },
        { label: "Replies this week", value: String(repliesWeek) },
      ];
    } else if (d.key === "leads") {
      stats = [{ label: "Agencies", value: String(count("agency") + count("prospect")) }];
    } else if (d.key === "care") {
      stats = [{ label: "Clients", value: String(count("client")) }];
    } else if (d.key === "products") {
      stats = [{ label: "Products", value: String(count("product")) }];
    } else if (d.key === "media") {
      stats = [{ label: "Videos", value: String(count("video")) }];
    } else if (d.key === "finance") {
      stats = [
        { label: "This month", value: money(thisMonth) },
        { label: "Monthly recurring", value: money(mrr) },
      ];
    } else if (d.key === "strategy") {
      stats = [{ label: "Ideas in the bank", value: "50" }];
    }
    const tasks = v?.tasks ?? [];
    return {
      key: d.key,
      name: d.name,
      color: d.color,
      href: v ? `/hq/${v.slug}` : d.key === "finance" ? "/hq/revenue" : undefined,
      status: v?.status ?? (d.key === "finance" ? (thisMonth > 0 ? "Earning" : "Live") : "Live"),
      agents: d.agents,
      stats,
      claudeTasks: tasks.filter((t) => t.owner === "claude").slice(0, 4).map((t) => t.title),
      myTasks: tasks.filter((t) => t.owner === "me").slice(0, 4).map((t) => t.title),
      recent: (d.key === "strategy" ? logs : v?.logs ?? []).map((l) => ({
        note: l.note,
        at: l.createdAt.toISOString(),
      })),
      activity: Math.min(1, (tasks.length + (v?.items.length ?? 0)) / 20),
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-widest text-[#8a8a8a] uppercase">Ghosttt · HQ</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Galaxy</h1>
          <p className="mt-1 text-sm text-[#8a8a8a]">Your whole business, live. Tap a department to look inside.</p>
        </div>
        <Link href="/hq" className="text-xs text-[#8a8a8a] hover:text-white">
          ← Command Center
        </Link>
      </div>
      <Galaxy
        departments={departments}
        hud={[
          { label: "Leads", value: String(leadCount) },
          { label: "Sent this week", value: String(sentWeek) },
          { label: "Replies", value: String(repliesWeek) },
          { label: "This month", value: money(thisMonth) },
        ]}
      />
    </div>
  );
}
