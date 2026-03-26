// src/db/schema.ts
import { pgTable, text, timestamp, uuid, pgEnum, boolean, integer } from "drizzle-orm/pg-core"

// ── Enums ─────────────────────────────────────────────────────────────────────

export const returnTypeEnum = pgEnum("return_type", ["GSTR-1", "GSTR-3B", "GSTR-9", "GSTR-2B"])

export const filingStatusEnum = pgEnum("filing_status", [
  "pending_docs",
  "docs_received",
  "ai_review",
  "ca_review",
  "ready_to_file",
  "filed",
])

export const periodTypeEnum = pgEnum("period_type", ["monthly", "quarterly", "annual"])

export const messageTypeEnum = pgEnum("message_type", ["checklist_request", "follow_up"])

// ── Clients ───────────────────────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      text("name").notNull(),
  gstin:     text("gstin").notNull().unique(),
  phone:     text("phone").notNull(),
  email:     text("email"),
  tradeName: text("trade_name"),
  notes:     text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── Filings ───────────────────────────────────────────────────────────────────

export const filings = pgTable("filings", {
  id:          uuid("id").primaryKey().defaultRandom(),
  clientId:    uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  returnType:  returnTypeEnum("return_type").notNull(),
  periodType:  periodTypeEnum("period_type").notNull(),
  periodLabel: text("period_label").notNull(),
  status:      filingStatusEnum("status").notNull().default("pending_docs"),
  caNotes:     text("ca_notes"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
})

// ── Checklist Items ───────────────────────────────────────────────────────────

export const checklistItems = pgTable("checklist_items", {
  id:          uuid("id").primaryKey().defaultRandom(),
  filingId:    uuid("filing_id").notNull().references(() => filings.id, { onDelete: "cascade" }),
  label:       text("label").notNull(),
  description: text("description"),
  isRequired:  boolean("is_required").notNull().default(true),
  isReceived:  boolean("is_received").notNull().default(false),
  fileKey:     text("file_key"),       // R2 object key once uploaded
  fileName:    text("file_name"),      // original filename from client
  sortOrder:   integer("sort_order").notNull().default(0),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
})

// ── Messages ──────────────────────────────────────────────────────────────────
// Tracks every WhatsApp message sent to a client for a filing.

export const messages = pgTable("messages", {
  id:          uuid("id").primaryKey().defaultRandom(),
  filingId:    uuid("filing_id").notNull().references(() => filings.id, { onDelete: "cascade" }),
  clientId:    uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  type:        messageTypeEnum("type").notNull(),
  twilioSid:   text("twilio_sid"),     // message SID from Twilio for tracking
  sentAt:      timestamp("sent_at").defaultNow().notNull(),
})

// ── Types ─────────────────────────────────────────────────────────────────────

export type Client           = typeof clients.$inferSelect
export type NewClient        = typeof clients.$inferInsert
export type Filing           = typeof filings.$inferSelect
export type NewFiling        = typeof filings.$inferInsert
export type ChecklistItem    = typeof checklistItems.$inferSelect
export type NewChecklistItem = typeof checklistItems.$inferInsert
export type Message          = typeof messages.$inferSelect