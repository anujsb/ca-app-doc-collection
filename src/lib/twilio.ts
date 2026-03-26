// src/lib/twilio.ts
import twilio from "twilio"
import type { Filing, ChecklistItem, Client } from "@/db/schema"

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const FROM = process.env.TWILIO_WHATSAPP_FROM! // e.g. whatsapp:+14155238886

export async function sendChecklistMessage(
  recipient: Client,
  filing: Filing,
  items: ChecklistItem[]
): Promise<string> {
  const required = items.filter(i => i.isRequired)
  const optional = items.filter(i => !i.isRequired)

  const lines: string[] = [
    `Hello,`,
    ``,
    `This is a request from your CA for documents required to file *${filing.returnType}* for *${filing.periodLabel}*.`,
    ``,
    `*Required documents:*`,
    ...required.map((item, idx) => `${idx + 1}. ${item.label}`),
  ]

  if (optional.length > 0) {
    lines.push(``, `*Optional (send if applicable):*`)
    optional.forEach((item, idx) => lines.push(`${idx + 1}. ${item.label}`))
  }

  lines.push(
    ``,
    `Please reply to this message with the documents as attachments.`,
    `Send one file at a time and mention the document name.`,
    ``,
    `Thank you.`
  )

  const body = lines.join("\n")
  const to   = recipient.phone.startsWith("whatsapp:")
    ? recipient.phone
    : `whatsapp:${recipient.phone}`

  const message = await client.messages.create({ from: FROM, to, body })
  return message.sid
}

export async function sendFollowUpMessage(
  phone: string,
  returnType: string,
  periodLabel: string,
  pendingItems: ChecklistItem[]
): Promise<string> {
  const lines = [
    `Reminder: We are still awaiting the following documents for *${returnType}* — *${periodLabel}*:`,
    ``,
    ...pendingItems.map((item, idx) => `${idx + 1}. ${item.label}`),
    ``,
    `Please send them at your earliest convenience. Thank you.`,
  ]

  const to = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`
  const message = await client.messages.create({ from: FROM, to, body: lines.join("\n") })
  return message.sid
}