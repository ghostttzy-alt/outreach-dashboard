import type { Metadata } from "next";
import { Video, ArrowRight, BookOpen, FileText, Calculator } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Resources — Ghosttt",
  description: "Free templates, planners, and tools for college students and small business owners.",
};

const PRODUCTS = [
  {
    icon: Calculator,
    name: "College Student Budget Planner",
    tag: "Students",
    tagColor: "#A855F7",
    description:
      "A clean, printable budget planner built for college life. Track your income, monthly expenses, and savings goals — all on one page.",
    pages: "8 pages",
    format: "PDF, US Letter",
    status: "coming_soon",
    note: "Coming to Gumroad soon — reply to my email to get notified when it's live.",
  },
  {
    icon: FileText,
    name: "Small Business Invoice & Quote Kit",
    tag: "Business Owners",
    tagColor: "#3DDC97",
    description:
      "Professional invoice and quote templates for cleaners, contractors, and service businesses. Editable, printable, and ready to use.",
    pages: "6 templates",
    format: "PDF, US Letter",
    status: "coming_soon",
    note: "Coming to Gumroad soon. Reply to my email to get your copy first.",
  },
  {
    icon: BookOpen,
    name: "Notion Student Dashboard",
    tag: "Students",
    tagColor: "#F97316",
    description:
      "A Notion template covering your schedule, class tracker, assignment due dates, and weekly review. Built for how students actually work.",
    pages: "5 views",
    format: "Notion Template",
    status: "coming_soon",
    note: "Coming soon. Reply to my email to get early access.",
  },
];

const YOUTUBE_TOPICS = [
  "How to eat on $25/week in college",
  "5 free tools every broke student needs",
  "Never buy a textbook at full price again",
  "Free software your school already pays for",
  "Get paid to take notes in class",
  "The bank account every student should have",
];

export default function FreePage() {
  return (
    <div className="hq-theme min-h-dvh">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

        {/* Hero */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#3ddc97]">Free Resources</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Actually useful, actually free.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[#8a8a8a]">
            Templates and tools for college students and small business owners. No email required.
            Just take what helps.
          </p>
        </div>

        {/* Products */}
        <div className="mb-14 space-y-4">
          {PRODUCTS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className="group rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-6 transition-colors hover:border-[#2f2f2f]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#1f1f1f] bg-[#111]">
                    <Icon className="size-5 text-[#8a8a8a]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{p.name}</h2>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: `${p.tagColor}18`, color: p.tagColor }}
                      >
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-sm text-[#8a8a8a]">{p.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#5a5a5a]">
                      <span>{p.pages}</span>
                      <span>·</span>
                      <span>{p.format}</span>
                    </div>
                    <div className="mt-4 rounded-lg border border-[#1f1f1f] bg-[#111] px-4 py-3">
                      <p className="text-xs text-[#8a8a8a]">{p.note}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* YouTube section */}
        <div className="mb-14 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-600/10">
              <Video className="size-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-semibold">College Hacks for Broke Students</h2>
              <p className="text-xs text-[#8a8a8a]">YouTube Shorts — new videos going live soon</p>
            </div>
          </div>
          <ul className="space-y-2">
            {YOUTUBE_TOPICS.map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-[#8a8a8a]">
                <span className="size-1.5 shrink-0 rounded-full bg-red-500/60" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-[#5a5a5a]">
            Search &ldquo;college hacks broke students&rdquo; on YouTube to find the channel when it&apos;s live.
          </p>
        </div>

        {/* For business owners callout */}
        <div className="mb-10 rounded-2xl border border-[#3ddc97]/20 bg-[#0a0a0a] p-6">
          <h2 className="font-semibold">Own a local business?</h2>
          <p className="mt-1 text-sm text-[#8a8a8a]">
            I build websites and handle monthly updates for small businesses in eastern North Carolina.
            Plans start at $49/month.
          </p>
          <Link
            href="/care"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#3ddc97] hover:underline"
          >
            See website care plans
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <p className="text-center text-xs text-[#5a5a5a]">
          © {new Date().getFullYear()} Ghosttt · Eastern North Carolina
        </p>
      </div>
    </div>
  );
}
