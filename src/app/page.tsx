"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import {
  UserPlus,
  Search,
  ClipboardList,
  MessageCircle,
  UploadCloud,
  BellRing,
  BellOff,
  LayoutDashboard,
  FolderCheck,
  Zap,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const flowSteps = [
  { icon: UserPlus,      num: "01", title: "Add Client",            desc: "Enter GSTIN, name, and phone number to begin." },
  { icon: Search,        num: "02", title: "Check Filing Status",   desc: "Fetches GST history and identifies pending returns." },
  { icon: ClipboardList, num: "03", title: "Identify Missing Data", desc: "Auto-checklist of pending invoices and returns." },
  { icon: MessageCircle, num: "04", title: "WhatsApp Client",       desc: "Sends an automatic message requesting documents." },
  { icon: UploadCloud,   num: "05", title: "Client Uploads",        desc: "Client uses a simple link to submit their files." },
  { icon: BellRing,      num: "06", title: "Auto Follow-ups",       desc: "Reminders keep going until all data is received." },
];

const features = [
  { icon: BellOff,         title: "Zero Repeated Follow-ups",   desc: "The system handles all reminders automatically. You never need to chase a client again." },
  { icon: LayoutDashboard, title: "Clear Pending Work View",    desc: "See exactly who has submitted, who hasn't, and what's still missing — at a glance." },
  { icon: FolderCheck,     title: "Auto-Organised Client Data", desc: "Files are validated and structured, ready to drop into TaxPro, ClearTax, or any filing software." },
  { icon: Zap,             title: "Faster Filing Process",      desc: "Less back-and-forth means more clients processed per day. Scale without adding headcount." },
];

const timeline = [
  { n: 1, title: "Add Client",              desc: "Enter GSTIN, client name, and phone number." },
  { n: 2, title: "System Checks Filing",    desc: "Fetches GST history and identifies pending returns." },
  { n: 3, title: "Missing Data Identified", desc: "Creates a checklist of pending invoices or returns." },
  { n: 4, title: "Automatic WhatsApp",      desc: "Sends client a request for required documents." },
  { n: 5, title: "Client Uploads Data",     desc: "Client submits files via a simple upload link." },
  { n: 6, title: "System Validates",        desc: "Checks if files are uploaded and correct." },
  { n: 7, title: "Automatic Follow-ups",    desc: "Sends reminders until all data is received." },
  { n: 8, title: "Data Becomes Ready",      desc: "All collected data is organised and prepared." },
  { n: 9, title: "You Review & File",       desc: "Upload into TaxPro, ClearTax, or your existing software." },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#2C2416] font-sans">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-16 py-5 border-b border-[#D9CEB8] bg-[#F5F0E8]">
        <Link href="/" className="flex items-center gap-2 text-[#2C2416] no-underline">
          <div className="w-9 h-9 rounded-lg bg-[#2C2416] flex items-center justify-center">
            <BarChart2 size={16} className="text-[#F5F0E8]" />
          </div>
          <span className="font-playfair text-xl">TaxFlow</span>
        </Link>

        <ul className="hidden md:flex items-center gap-9 list-none m-0 p-0">
          {[
            { label: "How it works", href: "#how-it-works" },
            { label: "Features",     href: "#features" },
            { label: "Dashboard",    href: "/dashboard" },
          ].map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="text-sm text-[#7A6E60] no-underline hover:text-[#2C2416] transition-colors">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth — signed out */}
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="outline" className="rounded-full text-sm px-5 border-[#D9CEB8] text-[#2C2416] bg-transparent hover:bg-[#EDE5D4] cursor-pointer">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="rounded-full text-sm px-5 bg-[#2C2416] text-[#F5F0E8] hover:bg-[#8B6F47] cursor-pointer">
                Get Started
              </Button>
            </SignUpButton>
          </Show>

          {/* Auth — signed in */}
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-full text-sm px-5 border-[#D9CEB8] text-[#2C2416] bg-transparent hover:bg-[#EDE5D4]">
                Dashboard
              </Button>
            </Link>
            <UserButton appearance={{ elements: { avatarBox: "w-9 h-9 rounded-full ring-2 ring-[#D9CEB8]" } }} />
          </Show>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-16 pt-20 pb-16">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs mb-8 border border-[#D9CEB8] bg-[#FDFAF4] text-[#7A6E60]">
          <span className="w-2 h-2 rounded-full bg-[#5A7A5A]" />
          GST Filing Automation — Zero Manual Follow-up
        </div>

        {/* Headline */}
        <h1 className="font-playfair text-5xl md:text-6xl font-semibold leading-tight mb-5 max-w-2xl">
          Collect client data,{" "}
          <em className="not-italic text-[#8B6F47]">without the chase.</em>
        </h1>

        <p className="text-base text-[#7A6E60] mb-9 max-w-lg">
          Automatically identify missing documents, send WhatsApp reminders, and
          get everything organised — before you even open your filing software.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-4 mb-16">
          <Show
            when="signed-out"
            fallback={
              <Link href="/dashboard">
                <Button className="rounded-full px-6 text-sm flex items-center gap-2 bg-[#2C2416] text-[#F5F0E8] hover:bg-[#8B6F47]">
                  Go to dashboard <ArrowRight size={14} />
                </Button>
              </Link>
            }
          >
            <SignUpButton mode="modal">
              <Button className="rounded-full px-6 text-sm flex items-center gap-2 bg-[#2C2416] text-[#F5F0E8] hover:bg-[#8B6F47] cursor-pointer">
                Try live demo <ArrowRight size={14} />
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button variant="outline" className="rounded-full px-6 text-sm border-[#D9CEB8] text-[#2C2416] bg-transparent hover:bg-[#EDE5D4] cursor-pointer">
                Sign in
              </Button>
            </SignInButton>
          </Show>
        </div>

        {/* ── FLOW CARD ── */}
        <div className="rounded-2xl overflow-hidden border border-[#D9CEB8] bg-[#FDFAF4] shadow-[0_4px_32px_rgba(44,36,22,0.06)]">
          {/* Titlebar */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[#D9CEB8] bg-[#EDE5D4]">
            <span className="w-3 h-3 rounded-full bg-red-300" />
            <span className="w-3 h-3 rounded-full bg-amber-300" />
            <span className="w-3 h-3 rounded-full bg-green-300" />
            <span className="ml-2 text-xs text-[#7A6E60]">Client data collection workflow</span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3">
            {flowSteps.map((step, i) => {
              const Icon = step.icon;
              const isLastRow = i >= 3;
              const isLastCol = (i + 1) % 3 === 0;
              return (
                <div
                  key={step.num}
                  className={[
                    "p-7",
                    !isLastCol  ? "border-r border-[#D9CEB8]" : "",
                    !isLastRow  ? "border-b border-[#D9CEB8]" : "",
                  ].join(" ")}
                >
                  <Icon size={18} className="mb-3 text-[#7A6E60]" />
                  <div className="font-playfair text-3xl font-semibold mb-2 text-[#D4C5A9]">{step.num}</div>
                  <div className="text-sm font-medium mb-1 text-[#2C2416]">{step.title}</div>
                  <div className="text-xs leading-relaxed text-[#7A6E60]">{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="max-w-6xl mx-auto px-16 py-20">
        <p className="text-xs tracking-widest uppercase font-medium mb-3 text-[#8B6F47]">What you get</p>
        <h2 className="font-playfair text-4xl font-semibold mb-3 max-w-sm leading-snug">
          Everything organised, nothing missed.
        </h2>
        <p className="text-sm text-[#7A6E60] mb-12 max-w-md">
          From first follow-up to final filing — one smooth pipeline.
        </p>
        <div className="grid grid-cols-2 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border border-[#D9CEB8] bg-[#FDFAF4] transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="w-11 h-11 rounded-xl bg-[#EDE5D4] flex items-center justify-center mb-5">
                    <Icon size={20} className="text-[#8B6F47]" />
                  </div>
                  <h3 className="text-sm font-medium mb-2 text-[#2C2416]">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[#7A6E60]">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="mx-16 mb-0 rounded-2xl px-16 py-16 bg-[#FDFAF4] border border-[#D9CEB8]">
        <p className="text-xs tracking-widest uppercase font-medium mb-3 text-[#8B6F47]">How it works</p>
        <h2 className="font-playfair text-4xl font-semibold mb-2 leading-snug">Nine steps, fully automated.</h2>
        <p className="text-sm text-[#7A6E60] mb-10">Your only job is the final review.</p>

        <div className="grid grid-cols-2 gap-x-16">
          {[timeline.slice(0, 5), timeline.slice(5)].map((col, ci) => (
            <div key={ci} className="relative">
              <div className="absolute top-0 bottom-0 w-px bg-[#D9CEB8]" style={{ left: 20 }} />
              {col.map((item) => (
                <div key={item.n} className="flex gap-7 pb-9 last:pb-0">
                  <div className="w-10 h-10 rounded-full shrink-0 relative z-10 flex items-center justify-center border border-[#D9CEB8] bg-[#FDFAF4] font-playfair text-sm text-[#8B6F47]">
                    {item.n}
                  </div>
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-1 text-[#2C2416]">{item.title}</h4>
                    <p className="text-xs leading-relaxed text-[#7A6E60]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <div className="mx-16 my-20">
        <div className="rounded-2xl px-16 py-14 flex items-center justify-between gap-8 bg-[#2C2416]">
          <h2 className="font-playfair text-3xl font-semibold leading-snug max-w-md text-[#F5F0E8]">
            Ready to stop chasing{" "}
            <em className="not-italic text-[#D4C5A9]">and start filing?</em>
          </h2>

          <Show
            when="signed-out"
            fallback={
              <Link href="/dashboard">
                <Button className="rounded-full px-7 py-5 text-sm flex items-center gap-2 whitespace-nowrap bg-[#C17F3C] text-white hover:bg-[#8B6F47]">
                  Go to dashboard <ArrowRight size={14} />
                </Button>
              </Link>
            }
          >
            <SignUpButton mode="modal">
              <Button className="rounded-full px-7 py-5 text-sm flex items-center gap-2 whitespace-nowrap bg-[#C17F3C] text-white hover:bg-[#8B6F47] cursor-pointer">
                Get started free <ArrowRight size={14} />
              </Button>
            </SignUpButton>
          </Show>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="flex items-center justify-between px-16 py-8 border-t border-[#D9CEB8] text-xs text-[#7A6E60]">
        <span className="font-playfair text-base text-[#2C2416]">TaxFlow</span>
        <span>© 2026 · Built for CA firms &amp; tax professionals</span>
        <span className="flex gap-4">
          <a href="#" className="text-[#7A6E60] hover:text-[#2C2416]">Privacy</a>
          <a href="#" className="text-[#7A6E60] hover:text-[#2C2416]">Terms</a>
        </span>
      </footer>
    </div>
  );
}