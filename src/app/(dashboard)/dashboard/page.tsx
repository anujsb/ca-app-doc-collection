"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import type { Client } from "@/db/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")

  const loadClients = useCallback(async () => {
    try {
      const res  = await fetch("/api/clients")
      const data = await res.json() as unknown
      if (!res.ok)           { setError((data as { error: string }).error ?? "Failed to load"); return }
      if (!Array.isArray(data)) { setError("Unexpected server response"); return }
      setClients(data as Client[])
    } catch {
      setError("Could not reach server")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadClients() }, [loadClients])

  return (
    <div className="p-8 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Clients</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {loading ? "Loading..." : `${clients.length} client${clients.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/clients/new">+ Add client</Link>
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-stone-200 rounded-xl bg-white">
          <p className="text-sm text-stone-400 mb-3">No clients yet</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/clients/new">Add your first client</Link>
          </Button>
        </div>
      )}

      {/* Client list */}
      {!loading && !error && clients.length > 0 && (
        <div className="grid gap-2">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer border-stone-100">
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-stone-600">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">{client.name}</p>
                      <p className="text-xs text-stone-400 font-mono mt-0.5">{client.gstin}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {client.tradeName && (
                      <Badge variant="secondary" className="text-xs">{client.tradeName}</Badge>
                    )}
                    <span className="text-xs text-stone-400">{client.phone}</span>
                    <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Stats row */}
      {!loading && clients.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-8">
          <Card className="border-stone-100">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-medium text-stone-500">Total clients</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-2xl font-semibold text-stone-900">{clients.length}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-100">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-medium text-stone-500">With email</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-2xl font-semibold text-stone-900">
                {clients.filter(c => c.email).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-stone-100">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-medium text-stone-500">Active return</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-2xl font-semibold text-stone-900">GSTR-1</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}