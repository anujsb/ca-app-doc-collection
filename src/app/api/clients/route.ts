// src/app/api/clients/route.ts
import { NextResponse } from "next/server"
import { db } from "@/db"
import { clients } from "@/db/schema"
import { validateGSTIN, formatGSTIN } from "@/lib/gstin"
import { desc } from "drizzle-orm"

export async function GET() {
  try {
    const all = await db.select().from(clients).orderBy(desc(clients.createdAt))
    return NextResponse.json(all)
  } catch {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, string>
    const { name, gstin, phone, email, tradeName, notes } = body

    if (!name || !gstin || !phone)
      return NextResponse.json({ error: "name, gstin, and phone are required" }, { status: 400 })

    const validation = validateGSTIN(gstin)
    if (!validation.valid)
      return NextResponse.json({ error: validation.error }, { status: 400 })

    const [client] = await db.insert(clients).values({
      name,
      gstin: formatGSTIN(gstin),
      phone,
      email: email ?? null,
      tradeName: tradeName ?? null,
      notes: notes ?? null,
    }).returning()

    return NextResponse.json(client, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ""
    if (msg.includes("unique"))
      return NextResponse.json({ error: "A client with this GSTIN already exists" }, { status: 409 })
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}