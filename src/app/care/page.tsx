import type { Metadata } from "next";
import { Check, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Website Care Plans — Ghosttt Web Design",
  description: "Keep your website fresh without lifting a finger. Monthly care plans starting at $49.",
};

const PLANS = [
  {
    name: "Starter",
    price: 49,
    description: "Light upkeep for simple sites that just need to stay current.",
    features: [
      "Up to 2 content updates per month (hours, prices, menu items)",
      "Monthly uptime check",
      "One Google Business Profile post per month",
      "Monthly 1-paragraph report by email",
    ],
  },
  {
    name: "Standard",
    price: 79,
    description: "The most popular plan. Covers everything a growing business needs.",
    features: [
      "Up to 5 content updates per month",
      "Weekly uptime monitoring",
      "Two Google Business Profile posts per month",
      "Seasonal or promotional banner updates",
      "Monthly 1-paragraph report by email",
    ],
    popular: true,
  },
  {
    name: "Full Service",
    price: 129,
    description: "Hands-off website management for busy owners who want it done for them.",
    features: [
      "Unlimited content updates",
      "Daily uptime monitoring",
      "Four Google Business Profile posts per month",
      "Holiday hours, seasonal banners, and menu changes",
      "Priority response (same business day)",
      "Monthly 1-paragraph report by email",
    ],
  },
];

const ADMIN_FEATURES = [
  "Reply to Google reviews on your behalf (you provide the tone/policy once)",
  "Post updates to Google Business Profile",
  "Update your menu, hours, or prices on your website",
  "Holiday hours set in advance so you never forget",
  "Simple social media post captions (Facebook/Instagram) — you post them",
];

export default function CarePage() {
  return (
    <div className="hq-theme min-h-dvh">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {/* Hero */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#3ddc97]">Website Care Plans</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your website, always up to date.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[#8a8a8a]">
            A website that never changes looks abandoned. I handle the updates, monitoring, and Google Business Profile so you can focus on running your business — not your website.
          </p>
        </div>

        {/* Plans */}
        <div className="mb-16 grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 transition-all ${
                plan.popular
                  ? "border-[#3ddc97]/60 bg-[#0a0a0a] shadow-[0_0_40px_rgba(61,220,151,0.08)]"
                  : "border-[#1f1f1f] bg-[#0a0a0a]"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3ddc97] px-3 py-0.5 text-[11px] font-semibold text-black">
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-bold text-[#3ddc97]">${plan.price}</span>
                <span className="mb-1 text-sm text-[#8a8a8a]">/mo</span>
              </div>
              <p className="mt-3 text-sm text-[#8a8a8a]">{plan.description}</p>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#3ddc97]" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Admin Add-On */}
        <div className="mb-16 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Admin Add-On</h2>
              <p className="mt-1 text-sm text-[#8a8a8a]">
                Go beyond website updates. I handle the day-to-day admin tasks that eat up your time.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-2xl font-bold text-[#3ddc97]">$100–$200</span>
              <p className="text-xs text-[#8a8a8a]">/mo on top of any plan</p>
            </div>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ADMIN_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-[#3ddc97]" />
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[#8a8a8a]">
            Price depends on how many tasks you need handled. Reply to my email and we&apos;ll figure out what fits.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="mb-6 text-center text-xl font-semibold">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", title: "You say yes", body: "Reply to my email and tell me which plan you want. No contracts, cancel any month." },
              { n: "2", title: "I set up access", body: "I&apos;ll need editor access to your website and your Google Business Profile login once." },
              { n: "3", title: "I handle it", body: "Send me updates anytime. I&apos;ll make them within one business day and send a monthly summary." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
                <div className="mb-3 flex size-8 items-center justify-center rounded-full border border-[#3ddc97]/30 text-sm font-bold text-[#3ddc97]">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-[#8a8a8a]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-[#3ddc97]/30 bg-[#0a0a0a] p-8 text-center">
          <Mail className="mx-auto mb-4 size-8 text-[#3ddc97]" />
          <h2 className="text-2xl font-bold">Ready to get started?</h2>
          <p className="mx-auto mt-2 max-w-sm text-[#8a8a8a]">
            Reply to my email with the plan you want and your business name. I&apos;ll take it from there.
          </p>
          <p className="mt-4 text-sm font-semibold text-[#3ddc97]">
            Just reply &ldquo;I want the [Starter / Standard / Full Service] plan&rdquo; to my last email.
          </p>
          <p className="mt-4 text-xs text-[#8a8a8a]">No contracts · Cancel anytime · First month prorated</p>
        </div>

        <p className="mt-8 text-center text-xs text-[#8a8a8a]">
          © {new Date().getFullYear()} Ghosttt Web Design · Eastern North Carolina
        </p>
      </div>
    </div>
  );
}
