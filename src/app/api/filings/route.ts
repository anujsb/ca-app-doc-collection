// src/app/api/filings/route.ts
import { NextResponse } from "next/server"
import { db } from "@/db"
import { filings, checklistItems } from "@/db/schema"
import { getChecklistForReturn } from "@/lib/checklist"
import { eq, desc } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get("clientId")
    if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

    const rows = await db
      .select().from(filings)
      .where(eq(filings.clientId, clientId))
      .orderBy(desc(filings.createdAt))

    const withItems = await Promise.all(
      rows.map(async (f) => {
        const items = await db
          .select().from(checklistItems)
          .where(eq(checklistItems.filingId, f.id))
          .orderBy(checklistItems.sortOrder)
        return { ...f, checklistItems: items }
      })
    )
    return NextResponse.json(withItems)
  } catch {
    return NextResponse.json({ error: "Failed to fetch filings" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body        = await req.json() as Record<string, string>
    const clientId    = body["clientId"]
    const returnType  = body["returnType"]
    const periodType  = body["periodType"]
    const periodLabel = body["periodLabel"]

    if (!clientId || !returnType || !periodType || !periodLabel)
      return NextResponse.json(
        { error: "clientId, returnType, periodType, and periodLabel are required" },
        { status: 400 }
      )

    const validReturnTypes = ["GSTR-1", "GSTR-3B", "GSTR-9", "GSTR-2B"] as const
    type ReturnType = typeof validReturnTypes[number]
    if (!validReturnTypes.includes(returnType as ReturnType))
      return NextResponse.json({ error: "Invalid returnType" }, { status: 400 })

    const validPeriodTypes = ["monthly", "quarterly", "annual"] as const
    type PeriodType = typeof validPeriodTypes[number]
    if (!validPeriodTypes.includes(periodType as PeriodType))
      return NextResponse.json({ error: "Invalid periodType" }, { status: 400 })

    const [filing] = await db.insert(filings)
      .values({
        clientId:    clientId,
        returnType:  returnType  as ReturnType,
        periodType:  periodType  as PeriodType,
        periodLabel: periodLabel,
      })
      .returning()

    const templates = getChecklistForReturn(returnType)
    if (templates.length > 0) {
      await db.insert(checklistItems).values(
        templates.map((t) => ({
          filingId:    filing!.id,
          label:       t.label,
          description: t.description,
          isRequired:  t.required,
          sortOrder:   t.sortOrder,
        }))
      )
    }

    const items = await db
      .select().from(checklistItems)
      .where(eq(checklistItems.filingId, filing!.id))
      .orderBy(checklistItems.sortOrder)

    return NextResponse.json({ ...filing, checklistItems: items }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create filing" }, { status: 500 })
  }
}