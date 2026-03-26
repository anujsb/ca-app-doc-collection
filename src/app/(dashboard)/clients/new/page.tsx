"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "", gstin: "", phone: "", email: "", tradeName: "", notes: "",
  })
  const [error, setError]   = useState("")
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit() {
    setError("")
    setSaving(true)
    try {
      const res  = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
      router.push(`/clients/${data.id}`)
    } finally {
      setSaving(false)
    }
  }

  const isValid = form.name.trim() && form.gstin.trim() && form.phone.trim()

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </button>

      <Card className="border-stone-100">
        <CardHeader>
          <CardTitle className="text-lg">Add client</CardTitle>
          <CardDescription>GSTIN and phone number are required to send document requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Business name <span className="text-red-400">*</span></Label>
              <Input id="name" placeholder="Acme Pvt Ltd" value={form.name} onChange={set("name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tradeName">Trade name</Label>
              <Input id="tradeName" placeholder="Acme" value={form.tradeName} onChange={set("tradeName")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gstin">
              GSTIN <span className="text-red-400">*</span>
              <span className="ml-2 text-xs font-normal text-stone-400">15 characters</span>
            </Label>
            <Input
              id="gstin"
              placeholder="27AAPFU0939F1ZV"
              value={form.gstin}
              onChange={set("gstin")}
              maxLength={15}
              className="font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                WhatsApp number <span className="text-red-400">*</span>
                <span className="ml-2 text-xs font-normal text-stone-400">with country code</span>
              </Label>
              <Input id="phone" placeholder="+919876543210" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="accounts@acme.com" value={form.email} onChange={set("email")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea
              id="notes"
              placeholder="Any notes about this client..."
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              className="resize-none"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-1">
            <Button onClick={handleSubmit} disabled={saving || !isValid} className="flex-1">
              {saving ? "Adding..." : "Add client"}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}