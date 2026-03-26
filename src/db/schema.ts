import { pgTable, text, timestamp, uuid, pgEnum, boolean, integer } from "drizzle-orm/pg-core"

// ── Enums ────────────────────────────────────────────────────────────────────

export const returnTypeEnum = pgEnum("return_type", [
  "GSTR-1",
  "GSTR-3B",
  "GSTR-9",
  "GSTR-2B",
])

export const filingStatusEnum = pgEnum("filing_status", [
  "pending_docs",      // checklist created, waiting for client docs
  "docs_received",     // client has sent something, under review
  "ai_review",         // LLM is checking docs (Step 3)
  "ca_review",         // CA reviewing AI output
  "ready_to_file",     // CA approved, ready to enter portal
  "filed",             // done
])

export const periodTypeEnum = pgEnum("period_type", ["monthly", "quarterly", "annual"])

// ── Clients ──────────────────────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      text("name").notNull(),
  gstin:     text("gstin").notNull().unique(),
  phone:     text("phone").notNull(),          // E.164 format e.g. +919876543210
  email:     text("email"),
  tradeName: text("trade_name"),               // optional business trade name
  notes:     text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── Filings ───────────────────────────────────────────────────────────────────
// One row per return-period combination for a client.
// e.g. client X → GSTR-1 → March 2025

export const filings = pgTable("filings", {
  id:          uuid("id").primaryKey().defaultRandom(),
  clientId:    uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  returnType:  returnTypeEnum("return_type").notNull(),
  periodType:  periodTypeEnum("period_type").notNull(),
  periodLabel: text("period_label").notNull(),  // e.g. "Mar 2025" or "Q4 FY2024-25"
  status:      filingStatusEnum("status").notNull().default("pending_docs"),
  caNotes:     text("ca_notes"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
})

// ── Checklist Items ───────────────────────────────────────────────────────────
// Each filing gets a set of checklist items generated from lib/checklist.ts
// Step 3 (AI) will update is_received and ai_status later.

export const checklistItems = pgTable("checklist_items", {
  id:          uuid("id").primaryKey().defaultRandom(),
  filingId:    uuid("filing_id").notNull().references(() => filings.id, { onDelete: "cascade" }),
  label:       text("label").notNull(),         // e.g. "B2B Sales Invoices"
  description: text("description"),             // tooltip / guidance text
  isRequired:  boolean("is_required").notNull().default(true),
  isReceived:  boolean("is_received").notNull().default(false),
  fileKey:     text("file_key"),                // S3/R2 key once uploaded (Step 2)
  sortOrder:   integer("sort_order").notNull().default(0),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
})

// ── Types ─────────────────────────────────────────────────────────────────────

export type Client         = typeof clients.$inferSelect
export type NewClient      = typeof clients.$inferInsert
export type Filing         = typeof filings.$inferSelect
export type NewFiling      = typeof filings.$inferInsert
export type ChecklistItem  = typeof checklistItems.$inferSelect
export type NewChecklistItem = typeof checklistItems.$inferInsert