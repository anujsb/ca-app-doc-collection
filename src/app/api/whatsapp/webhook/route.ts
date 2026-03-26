// src/app/api/whatsapp/webhook/route.ts
//
// Twilio calls this endpoint when the client replies on WhatsApp.
// If the reply contains a media attachment (document/image/pdf),
// we download it from Twilio, upload to R2, and mark the best-matching
// checklist item as received.
//
// Twilio webhook config (in Twilio console):
//   URL: https://your-domain.com/api/whatsapp/webhook
//   Method: POST

import { NextResponse } from "next/server"
import { db } from "@/db"
import { checklistItems, filings, clients, messages } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { uploadToR2, fetchTwilioMedia } from "@/lib/r2"

// Twilio sends form-encoded POST bodies
async function parseTwilioBody(req: Request): Promise<Record<string, string>> {
  const text   = await req.text()
  const params = new URLSearchParams(text)
  const result: Record<string, string> = {}
  params.forEach((v, k) => { result[k] = v })
  return result
}

// Simple fuzzy match: find the checklist item whose label best matches
// the client's message body text (they often just type the doc name).
function matchItem(items: typeof checklistItems.$inferSelect[], body: string) {
  const lower = body.toLowerCase()
  // Exact or partial label match first
  const match = items
    .filter(i => !i.isReceived)
    .find(i => lower.includes(i.label.toLowerCase().split(" ")[0]!))
  // Fall back to first unreceived required item
  return match ?? items.find(i => !i.isReceived && i.isRequired) ?? items.find(i => !i.isReceived)
}

export async function POST(req: Request) {
  try {
    const body = await parseTwilioBody(req)

    const from       = body["From"] ?? ""          // whatsapp:+919876543210
    const msgBody    = body["Body"] ?? ""
    const numMedia   = parseInt(body["NumMedia"] ?? "0", 10)

    // No attachment — ignore (follow-ups will handle text replies later)
    if (numMedia === 0) {
      return new NextResponse("<?xml version='1.0'?><Response></Response>", {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Normalise phone: strip "whatsapp:" prefix for DB lookup
    const phone = from.replace("whatsapp:", "")

    // Find the client by phone
    const [client] = await db.select().from(clients).where(eq(clients.phone, phone))
    if (!client) {
      console.warn("[webhook] Unknown sender:", phone)
      return new NextResponse("<?xml version='1.0'?><Response></Response>", {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Find the most recent pending filing for this client
    const clientFilings = await db
      .select().from(filings)
      .where(and(
        eq(filings.clientId, client.id),
        eq(filings.status,   "pending_docs")
      ))

    if (clientFilings.length === 0) {
      console.warn("[webhook] No pending filing for client:", client.id)
      return new NextResponse("<?xml version='1.0'?><Response></Response>", {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Use the most recently created pending filing
    const filing = clientFilings.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]!

    // Load unreceived checklist items for this filing
    const items = await db
      .select().from(checklistItems)
      .where(eq(checklistItems.filingId, filing.id))
      .orderBy(checklistItems.sortOrder)

    // Process each media attachment (clients sometimes send multiple files)
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl         = body[`MediaUrl${i}`]
      const mediaContentType = body[`MediaContentType${i}`] ?? "application/octet-stream"

      if (!mediaUrl) continue

      // Determine filename from content type
      const ext      = mediaContentType.split("/")[1]?.split(";")[0] ?? "bin"
      const fileName = `file_${Date.now()}_${i}.${ext}`
      const r2Key    = `${filing.id}/${fileName}`

      // Download from Twilio → upload to R2
      const { buffer } = await fetchTwilioMedia(mediaUrl)
      await uploadToR2(r2Key, buffer, mediaContentType)

      // Match to a checklist item
      const matched = matchItem(items, msgBody)
      if (matched) {
        await db.update(checklistItems)
          .set({ isReceived: true, fileKey: r2Key, fileName })
          .where(eq(checklistItems.id, matched.id))

        // Mark the item as received in our local array so next file matches the next item
        matched.isReceived = true
      }
    }

    // Reload items to check if all required ones are received
    const updatedItems = await db
      .select().from(checklistItems)
      .where(eq(checklistItems.filingId, filing.id))

    const allRequiredReceived = updatedItems
      .filter(i => i.isRequired)
      .every(i => i.isReceived)

    if (allRequiredReceived) {
      await db.update(filings)
        .set({ status: "docs_received", updatedAt: new Date() })
        .where(eq(filings.id, filing.id))
    }

    // Record inbound message
    await db.insert(messages).values({
      filingId:  filing.id,
      clientId:  client.id,
      type:      "checklist_request" as const,
      twilioSid: body["MessageSid"] ?? null,
    })

    // Respond with empty TwiML (no auto-reply for now)
    return new NextResponse("<?xml version='1.0'?><Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[webhook]", msg)
    // Always return 200 to Twilio or it will retry
    return new NextResponse("<?xml version='1.0'?><Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    })
  }
}