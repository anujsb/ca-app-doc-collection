"use client";

import { UserButton } from "@clerk/nextjs";
import {
  BarChart2,
  Plus,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  FileText,
  MessageCircle,
  UploadCloud,
  Users,
  TrendingUp,
  Filter,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "complete" | "pending" | "waiting" | "overdue";

interface Client {
  id: string;
  name: string;
  gstin: string;
  status: Status;
  lastActivity: string;
  docsReceived: number;
  docsTotal: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const clients: Client[] = [
  { id: "1", name: "Sharma & Sons Traders",  gstin: "27AAPCS1234A1Z5", status: "complete", lastActivity: "2 hours ago", docsReceived: 6, docsTotal: 6 },
  { id: "2", name: "Mehta Exports Pvt Ltd",  gstin: "07AAACM5678B1Z3", status: "pending",  lastActivity: "5 hours ago", docsReceived: 3, docsTotal: 7 },
  { id: "3", name: "Rajesh Hardware Store",  gstin: "29AABCR8765C1Z1", status: "waiting",  lastActivity: "1 day ago",   docsReceived: 1, docsTotal: 4 },
  { id: "4", name: "Priya Fashion Hub",      gstin: "24AAECP4321D1Z8", status: "overdue",  lastActivity: "5 days ago",  docsReceived: 0, docsTotal: 5 },
  { id: "5", name: "Gupta Medical Supplies", gstin: "06AABCG2109E1Z2", status: "pending",  lastActivity: "3 hours ago", docsReceived: 4, docsTotal: 6 },
  { id: "6", name: "Anand Construction Co.", gstin: "33AAACA9087F1Z6", status: "complete", lastActivity: "Just now",    docsReceived: 8, docsTotal: 8 },
];

const statCards = [
  { label: "Total Clients",      value: "24", sub: "+3 this month",  icon: Users,        colorClass: "text-tf-brown",  bgClass: "bg-tf-beige" },
  { label: "Ready to File",      value: "9",  sub: "37% of clients", icon: CheckCircle2, colorClass: "text-tf-green",  bgClass: "bg-tf-beige" },
  { label: "Awaiting Documents", value: "11", sub: "Auto follow-up", icon: Clock,        colorClass: "text-tf-accent", bgClass: "bg-tf-beige" },
  { label: "Overdue (5+ days)",  value: "4",  sub: "Action needed",  icon: AlertCircle,  colorClass: "text-red-400",   bgClass: "bg-red-50"   },
];

const recentActivity = [
  { icon: UploadCloud,   text: "Sharma & Sons uploaded 3 documents",   time: "2h ago", colorClass: "text-tf-green"  },
  { icon: MessageCircle, text: "Auto-reminder sent to Rajesh Hardware", time: "4h ago", colorClass: "text-tf-brown"  },
  { icon: CheckCircle2,  text: "Anand Construction marked ready",       time: "6h ago", colorClass: "text-tf-green"  },
  { icon: AlertCircle,   text: "Priya Fashion — 5 days no response",    time: "5d ago", colorClass: "text-red-400"   },
  { icon: RefreshCw,     text: "GST status refreshed for 24 clients",   time: "Today",  colorClass: "text-tf-brown"  },
];

const statusConfig: Record<Status, { label: string; pill: string }> = {
  complete: { label: "Ready",   pill: "bg-green-100 text-green-800"  },
  pending:  { label: "Pending", pill: "bg-amber-100 text-amber-800"  },
  waiting:  { label: "Waiting", pill: "bg-tf-beige text-tf-brown"    },
  overdue:  { label: "Overdue", pill: "bg-red-100 text-red-700"      },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | Status>("all");
  const [searchQuery, setSearchQuery]   = useState("");

  const filtered = clients.filter((c) => {
    const matchesFilter = activeFilter === "all" || c.status === activeFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.gstin.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-tf-bg text-tf-dark font-sans flex">

      {/* ── SIDEBAR ── */}
      <aside className="fixed top-0 left-0 h-full w-60 bg-tf-dark flex flex-col z-40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-tf-bg flex items-center justify-center">
            <BarChart2 size={14} className="text-tf-dark" />
          </div>
          <span className="font-playfair text-lg text-tf-bg">TaxFlow</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {[
            { icon: BarChart2,     label: "Dashboard", active: true  },
            { icon: Users,         label: "Clients",   active: false },
            { icon: FileText,      label: "Returns",   active: false },
            { icon: MessageCircle, label: "Messages",  active: false },
            { icon: UploadCloud,   label: "Documents", active: false },
            { icon: TrendingUp,    label: "Reports",   active: false },
          ].map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                active
                  ? "bg-white/10 text-tf-bg"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80",
              ].join(" ")}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-5 border-t border-white/10">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{ elements: { avatarBox: "w-8 h-8 rounded-full ring-2 ring-white/20" } }}
            />
            <div>
              <p className="text-xs text-tf-bg font-medium">CA Firm Portal</p>
              <p className="text-[10px] text-white/40">Pro plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="ml-60 flex-1 min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-tf-bg border-b border-tf-border">
          <div>
            <h1 className="font-playfair text-2xl font-semibold">Dashboard</h1>
            <p className="text-xs text-tf-muted mt-0.5">March 2026 · GST filing season</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="relative w-9 h-9 rounded-full flex items-center justify-center border border-tf-border bg-tf-card hover:bg-tf-beige transition-colors">
              <Bell size={15} className="text-tf-muted" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400" />
            </Button>
            <Button className="rounded-full px-4 text-sm flex items-center gap-2 bg-tf-dark text-tf-bg hover:bg-tf-brown h-9">
              <Plus size={13} />
              Add Client
            </Button>
          </div>
        </header>

        <div className="px-8 py-7 space-y-6">

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-4 gap-4">
            {statCards.map(({ label, value, sub, icon: Icon, colorClass, bgClass }) => (
              <Card key={label} className="border border-tf-border bg-tf-card shadow-none hover:-translate-y-0.5 hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bgClass}`}>
                      <Icon size={16} className={colorClass} />
                    </div>
                    <ArrowUpRight size={13} className="text-tf-tan mt-0.5" />
                  </div>
                  <p className="font-playfair text-3xl font-semibold">{value}</p>
                  <p className="text-xs font-medium mt-0.5">{label}</p>
                  <p className="text-[11px] text-tf-muted mt-0.5">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── TWO-COLUMN ── */}
          <div className="grid grid-cols-3 gap-5">

            {/* Client Table */}
            <div className="col-span-2">
              <Card className="border border-tf-border bg-tf-card shadow-none">
                <CardContent className="p-0">

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-tf-beige flex-wrap gap-2">
                    <h2 className="font-playfair text-base font-semibold">Client Overview</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-tf-muted" />
                        <input
                          type="text"
                          placeholder="Search clients…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs rounded-full border border-tf-border bg-tf-bg text-tf-dark placeholder-tf-tan outline-none focus:border-tf-brown transition-colors w-36"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        {(["all", "complete", "pending", "waiting", "overdue"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={[
                              "px-2.5 py-1 rounded-full text-[11px] capitalize transition-colors",
                              activeFilter === f
                                ? "bg-tf-dark text-tf-bg"
                                : "bg-tf-beige text-tf-muted hover:bg-tf-border",
                            ].join(" ")}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-tf-beige">
                    {filtered.map((client) => {
                      const st  = statusConfig[client.status];
                      const pct = Math.round((client.docsReceived / client.docsTotal) * 100);
                      return (
                        <div
                          key={client.id}
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-tf-bg transition-colors group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-tf-beige flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-tf-brown">{client.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{client.name}</p>
                            <p className="text-[11px] text-tf-muted font-mono">{client.gstin}</p>
                          </div>
                          <div className="w-24 shrink-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-tf-muted">Docs</span>
                              <span className="text-[10px] font-medium">{client.docsReceived}/{client.docsTotal}</span>
                            </div>
                            <div className="h-1 rounded-full bg-tf-beige overflow-hidden">
                              <div
                                className={[
                                  "h-full rounded-full transition-all",
                                  pct === 100 ? "bg-tf-green" : pct > 50 ? "bg-tf-accent" : "bg-red-400",
                                ].join(" ")}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${st.pill}`}>
                            {st.label}
                          </span>
                          <p className="text-[11px] text-tf-muted shrink-0 w-20 text-right">{client.lastActivity}</p>
                          <ChevronRight size={14} className="text-tf-tan opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-tf-beige flex items-center justify-between">
                    <p className="text-xs text-tf-muted">Showing {filtered.length} of {clients.length} clients</p>
                    <button className="text-xs text-tf-brown flex items-center gap-1 hover:text-tf-dark transition-colors">
                      View all <ChevronRight size={11} />
                    </button>
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Activity feed */}
              <Card className="border border-tf-border bg-tf-card shadow-none">
                <CardContent className="p-0">
                  <div className="px-5 py-4 border-b border-tf-beige">
                    <h2 className="font-playfair text-base font-semibold">Recent Activity</h2>
                  </div>
                  <div className="divide-y divide-tf-beige">
                    {recentActivity.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="flex gap-3 px-5 py-3 items-start">
                          <div className="w-7 h-7 rounded-lg bg-tf-beige flex items-center justify-center shrink-0 mt-0.5">
                            <Icon size={12} className={item.colorClass} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs leading-relaxed">{item.text}</p>
                            <p className="text-[10px] text-tf-muted mt-0.5">{item.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card className="border border-tf-border bg-tf-dark shadow-none">
                <CardContent className="p-5 space-y-2.5">
                  <h2 className="font-playfair text-base font-semibold text-tf-bg mb-3">Quick Actions</h2>
                  {[
                    { icon: Plus,          label: "Add new client",       sub: "Enter GSTIN to begin" },
                    { icon: RefreshCw,     label: "Refresh GST statuses", sub: "Sync all 24 clients"  },
                    { icon: MessageCircle, label: "Send bulk reminders",  sub: "11 clients awaiting"  },
                    { icon: FileText,      label: "Export ready filings", sub: "9 clients ready"      },
                  ].map(({ icon: Icon, label, sub }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Icon size={13} className="text-tf-tan" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-tf-bg">{label}</p>
                        <p className="text-[10px] text-white/40">{sub}</p>
                      </div>
                      <ChevronRight size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
                    </button>
                  ))}
                </CardContent>
              </Card>

            </div>
          </div>

          {/* ── FILING PIPELINE ── */}
          <Card className="border border-tf-border bg-tf-card shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-playfair text-base font-semibold">Filing Pipeline</h2>
                  <p className="text-xs text-tf-muted mt-0.5">Current status across all clients</p>
                </div>
                <button className="text-xs text-tf-muted flex items-center gap-1.5 hover:text-tf-dark transition-colors">
                  <Filter size={11} /> Filter
                </button>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {[
                  { stage: "Added",          count: 24, cls: "bg-tf-beige  border-tf-border text-tf-brown"  },
                  { stage: "Status Checked", count: 22, cls: "bg-tf-beige  border-tf-tan    text-tf-brown"  },
                  { stage: "Docs Requested", count: 18, cls: "bg-amber-50  border-amber-200 text-amber-700" },
                  { stage: "Docs Received",  count: 11, cls: "bg-green-50  border-green-200 text-tf-green"  },
                  { stage: "Ready to File",  count: 9,  cls: "bg-green-100 border-green-300 text-green-800" },
                ].map((s, i, arr) => (
                  <div key={s.stage} className="relative">
                    <div className={`rounded-xl p-4 border ${s.cls}`}>
                      <p className="font-playfair text-2xl font-semibold mb-1">{s.count}</p>
                      <p className="text-[11px] font-medium text-tf-dark">{s.stage}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <ChevronRight size={14} className="absolute -right-2 top-1/2 -translate-y-1/2 text-tf-tan z-10" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-tf-muted">Overall completion</p>
                  <p className="text-xs font-medium">37.5%</p>
                </div>
                <div className="h-2 rounded-full bg-tf-beige overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-tf-brown to-tf-green"
                    style={{ width: "37.5%" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}