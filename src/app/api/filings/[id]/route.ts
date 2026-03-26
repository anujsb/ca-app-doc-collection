// src/app/api/filings/[id]/route.ts
import { NextResponse } from "next/server"
import { db } from "@/db"
import { filings, checklistItems } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const [filing] = await db.select().from(filings).where(eq(filings.id, id))
    if (!filing) return NextResponse.json({ error: "Filing not found" }, { status: 404 })

    const items = await db
      .select().from(checklistItems)
      .where(eq(checklistItems.filingId, id))
      .orderBy(checklistItems.sortOrder)

    return NextResponse.json({ ...filing, checklistItems: items })
  } catch {
    return NextResponse.json({ error: "Failed to fetch filing" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json() as Record<string, string>
    const updates: Record<string, string | Date> = { updatedAt: new Date() }
    if (body.status)               updates.status   = body.status
    if (body.caNotes !== undefined) updates.caNotes = body.caNotes

    const [updated] = await db.update(filings).set(updates).where(eq(filings.id, id)).returning()
    if (!updated) return NextResponse.json({ error: "Filing not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to update filing" }, { status: 500 })
  }
}