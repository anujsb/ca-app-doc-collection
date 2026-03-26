// src/app/api/whatsapp/send/route.ts
import { NextResponse } from "next/server"
import { db } from "@/db"
import { filings, checklistItems, clients, messages } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sendChecklistMessage } from "@/lib/twilio"

export async function POST(req: Request) {
  try {
    const body = await req.json() as { filingId?: string }
    const { filingId } = body
    if (!filingId)
      return NextResponse.json({ error: "filingId required" }, { status: 400 })

    const [filing] = await db.select().from(filings).where(eq(filings.id, filingId))
    if (!filing)
      return NextResponse.json({ error: "Filing not found" }, { status: 404 })

    const [client] = await db.select().from(clients).where(eq(clients.id, filing.clientId))
    if (!client)
      return NextResponse.json({ error: "Client not found" }, { status: 404 })

    const items = await db
      .select().from(checklistItems)
      .where(eq(checklistItems.filingId, filingId))
      .orderBy(checklistItems.sortOrder)

    if (items.length === 0)
      return NextResponse.json({ error: "No checklist items found for this filing" }, { status: 400 })

    const twilioSid = await sendChecklistMessage(client, filing, items)

    await db.insert(messages).values({
      filingId:  filingId,
      clientId:  client.id,
      type:      "checklist_request" as const,
      twilioSid: twilioSid,
    })

    await db.update(filings)
      .set({ status: "pending_docs", updatedAt: new Date() })
      .where(eq(filings.id, filingId))

    return NextResponse.json({ success: true, twilioSid })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[whatsapp/send]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}