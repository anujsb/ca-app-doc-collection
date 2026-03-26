// src/app/(dashboard)/clients/[id]/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Client, Filing, ChecklistItem } from "@/db/schema"
import { getSuggestedFilings, formatDueLabel, type SuggestedFiling } from "@/lib/due-dates"
import { SUPPORTED_RETURN_TYPES } from "@/lib/checklist"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

type FilingWithItems = Filing & { checklistItems: ChecklistItem[] }

const PERIOD_LABELS_MONTHLY = [
  "Apr 2025","May 2025","Jun 2025","Jul 2025","Aug 2025","Sep 2025",
  "Oct 2025","Nov 2025","Dec 2025","Jan 2026","Feb 2026","Mar 2026",
]

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_docs:  { label: "Pending docs",  variant: "outline"   },
  docs_received: { label: "Docs received", variant: "default"   },
  ai_review:     { label: "AI review",     variant: "secondary" },
  ca_review:     { label: "CA review",     variant: "secondary" },
  ready_to_file: { label: "Ready to file", variant: "default"   },
  filed:         { label: "Filed",         variant: "secondary" },
}

const URGENCY_CLASS: Record<SuggestedFiling["urgency"], string> = {
  overdue:  "border-red-200 bg-red-50 text-red-700",
  due_soon: "border-amber-200 bg-amber-50 text-amber-700",
  upcoming: "border-stone-200 bg-stone-50 text-stone-600",
}

export default function ClientPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [client,      setClient]      = useState<Client | null>(null)
  const [filings,     setFilings]     = useState<FilingWithItems[]>([])
  const [suggestions, setSuggestions] = useState<SuggestedFiling[]>([])
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [showManual,  setShowManual]  = useState(false)
  const [creating,    setCreating]    = useState<string | null>(null)
  const [sending,     setSending]     = useState<string | null>(null)  // filingId being sent
  const [sendError,   setSendError]   = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState("")

  const [manualForm, setManualForm] = useState({
    returnType:  SUPPORTED_RETURN_TYPES[0] ?? "GSTR-1",
    periodLabel: PERIOD_LABELS_MONTHLY[PERIOD_LABELS_MONTHLY.length - 1],
  })

  const loadFilings = useCallback(async () => {
    const res = await fetch(`/api/filings?clientId=${id}`)
    if (!res.ok) return
    const data = await res.json() as FilingWithItems[]
    setFilings(data)
    setSuggestions(getSuggestedFilings(data.map(f => f.periodLabel)))
  }, [id])

  useEffect(() => {
    const init = async () => {
      try {
        const [clientRes] = await Promise.all([
          fetch(`/api/clients/${id}`),
          loadFilings(),
        ])
        const clientData = await clientRes.json() as Client & { error?: string }
        if (!clientRes.ok || !clientData.name) {
          setError(clientData.error ?? "Client not found")
        } else {
          setClient(clientData)
        }
      } catch {
        setError("Failed to load client")
      } finally {
        setLoading(false)
      }
    }
    void init()
  }, [id, loadFilings])

  async function createFiling(returnType: string, periodType: string, periodLabel: string) {
    setCreating(periodLabel)
    try {
      const res  = await fetch("/api/filings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id, returnType, periodType, periodLabel }),
      })
      const data = await res.json() as FilingWithItems
      if (res.ok) {
        setFilings(f => [data, ...f])
        setExpanded(data.id)
        setShowManual(false)
        setSuggestions(s => s.filter(sg => sg.periodLabel !== periodLabel))
      }
    } finally {
      setCreating(null)
    }
  }

  async function sendChecklist(filingId: string) {
    setSending(filingId)
    setSendError(null)
    try {
      const res  = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filingId }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) {
        setSendError(data.error ?? "Failed to send message")
      }
      // Reload filings to pick up status change
      await loadFilings()
    } finally {
      setSending(null)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 max-w-3xl space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !client) {
    return (
      <div className="p-8 max-w-3xl space-y-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All clients
        </button>
        <Alert variant="destructive">
          <AlertDescription>{error || "Client not found."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const overdueSuggestions  = suggestions.filter(s => s.urgency !== "upcoming")
  const upcomingSuggestions = suggestions.filter(s => s.urgency === "upcoming")
  const avatarLetter        = client.name?.charAt(0)?.toUpperCase() ?? "?"

  return (
    <div className="p-8 max-w-3xl space-y-6">

      {/* Back */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        All clients
      </button>

      {/* Client card */}
      <Card className="border-stone-100">
        <CardContent className="pt-5 pb-5 px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                <span className="text-base font-semibold text-stone-600">{avatarLetter}</span>
              </div>
              <div>
                <h1 className="text-base font-semibold text-stone-900">{client.name}</h1>
                {client.tradeName && <p className="text-sm text-stone-400">{client.tradeName}</p>}
                <p className="text-xs font-mono text-stone-400 mt-0.5">{client.gstin}</p>
              </div>
            </div>
            <div className="text-right text-xs text-stone-400 space-y-0.5 shrink-0">
              <p>{client.phone}</p>
              {client.email && <p>{client.email}</p>}
            </div>
          </div>
          {client.notes && (
            <>
              <Separator className="my-3" />
              <p className="text-xs text-stone-400">{client.notes}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Send error */}
      {sendError && (
        <Alert variant="destructive">
          <AlertDescription>{sendError}</AlertDescription>
        </Alert>
      )}

      {/* Suggested filings */}
      {overdueSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Suggested filings</p>
          {overdueSuggestions.map(s => (
            <div
              key={s.periodLabel}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border ${URGENCY_CLASS[s.urgency]}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{s.returnType}</span>
                <span className="text-sm">{s.periodLabel}</span>
                <span className="text-xs opacity-70">{formatDueLabel(s)}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-current bg-white hover:bg-white/80"
                disabled={creating === s.periodLabel}
                onClick={() => void createFiling(s.returnType, s.periodType, s.periodLabel)}
              >
                {creating === s.periodLabel ? "Creating..." : "Start filing"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Filings section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
            Filings{filings.length > 0 && <span className="ml-1 font-normal normal-case text-stone-400">({filings.length})</span>}
          </p>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowManual(v => !v)}>
            {showManual ? "Cancel" : "+ New filing"}
          </Button>
        </div>

        {/* Manual form */}
        {showManual && (
          <Card className="border-stone-200">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium">Manual entry</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-500">Return type</label>
                  <Select value={manualForm.returnType} onValueChange={v => setManualForm(f => ({ ...f, returnType: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_RETURN_TYPES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-500">Period</label>
                  <Select value={manualForm.periodLabel} onValueChange={v => setManualForm(f => ({ ...f, periodLabel: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PERIOD_LABELS_MONTHLY.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {upcomingSuggestions.length > 0 && (
                <div>
                  <p className="text-xs text-stone-400 mb-2">Quick pick — upcoming:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {upcomingSuggestions.map(s => (
                      <Button
                        key={s.periodLabel}
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        disabled={!!creating}
                        onClick={() => void createFiling(s.returnType, s.periodType, s.periodLabel)}
                      >
                        {s.periodLabel}
                        <span className="ml-1 text-stone-400">{formatDueLabel(s)}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                size="sm"
                disabled={!!creating}
                onClick={() => void createFiling(manualForm.returnType, "monthly", manualForm.periodLabel)}
              >
                {creating ? "Creating..." : "Create + generate checklist"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {filings.length === 0 && !showManual && (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-stone-200 rounded-xl bg-white">
            <p className="text-sm text-stone-400">
              No filings yet.{" "}
              {overdueSuggestions.length > 0 ? "Use a suggestion above or " : ""}
              Click &ldquo;+ New filing&rdquo; to start.
            </p>
          </div>
        )}

        {/* Filing cards */}
        {filings.map(filing => {
          const status   = STATUS_CONFIG[filing.status] ?? { label: filing.status, variant: "outline" as const }
          const isOpen   = expanded === filing.id
          const received = filing.checklistItems.filter(i => i.isReceived).length
          const total    = filing.checklistItems.length
          const isSending = sending === filing.id

          return (
            <Card key={filing.id} className="border-stone-100 overflow-hidden">
              {/* Filing header row */}
              <CardContent className="flex items-center justify-between py-3.5 px-5">
                <button
                  className="flex items-center gap-3 flex-1 text-left"
                  onClick={() => setExpanded(isOpen ? null : filing.id)}
                >
                  <span className="text-sm font-medium text-stone-800">{filing.returnType}</span>
                  <span className="text-xs text-stone-400">{filing.periodLabel}</span>
                  <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">{received}/{total} docs</span>

                  {/* Send checklist button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5"
                    disabled={isSending}
                    onClick={() => void sendChecklist(filing.id)}
                  >
                    {isSending ? (
                      "Sending..."
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                        </svg>
                        Send checklist
                      </>
                    )}
                  </Button>

                  <Button onClick={() => setExpanded(isOpen ? null : filing.id)}>
                    <svg
                      className={`w-4 h-4 text-stone-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </Button>
                </div>
              </CardContent>

              {/* Expanded checklist */}
              {isOpen && (
                <>
                  <Separator />
                  <CardContent className="px-5 py-4 space-y-3">
                    {filing.checklistItems
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map(item => (
                        <div key={item.id} className="flex items-start gap-3">
                          {/* Status indicator */}
                          <div className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center text-xs ${
                            item.isReceived
                              ? "bg-green-100 border-green-300 text-green-700"
                              : "border-stone-300 bg-white"
                          }`}>
                            {item.isReceived && "✓"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm text-stone-800">{item.label}</p>
                              {!item.isRequired && (
                                <span className="text-xs text-stone-400">optional</span>
                              )}
                              {/* Show filename if file received */}
                              {item.isReceived && item.fileName && (
                                <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded font-mono">
                                  {item.fileName}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}

                    {filing.caNotes && (
                      <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                        <p className="text-xs text-amber-700">{filing.caNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}