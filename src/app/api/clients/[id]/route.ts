// src/app/api/clients/[id]/route.ts
import { NextResponse } from "next/server"
import { db } from "@/db"
import { clients } from "@/db/schema"
import { eq } from "drizzle-orm"
import { validateGSTIN, formatGSTIN } from "@/lib/gstin"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const [client] = await db.select().from(clients).where(eq(clients.id, id))
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json() as Record<string, string | null>
    const updates: Record<string, string | null | Date> = { updatedAt: new Date() }

    if (body.name)                    updates.name      = body.name
    if (body.phone)                   updates.phone     = body.phone
    if (body.email !== undefined)     updates.email     = body.email
    if (body.tradeName !== undefined) updates.tradeName = body.tradeName
    if (body.notes !== undefined)     updates.notes     = body.notes

    if (body.gstin) {
      const v = validateGSTIN(body.gstin)
      if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 })
      updates.gstin = formatGSTIN(body.gstin)
    }

    const [updated] = await db.update(clients).set(updates).where(eq(clients.id, id)).returning()
    if (!updated) return NextResponse.json({ error: "Client not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const [deleted] = await db.delete(clients).where(eq(clients.id, id)).returning()
    if (!deleted) return NextResponse.json({ error: "Client not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}