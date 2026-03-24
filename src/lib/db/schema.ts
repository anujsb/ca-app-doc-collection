import {
  pgTable,
  text,
  timestamp,
  integer,
  pgEnum,
  uuid,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const clientStatusEnum = pgEnum("client_status", [
  "added",
  "status_checked",
  "docs_requested",
  "docs_received",
  "ready_to_file",
  "filed",
]);

export const emailTypeEnum = pgEnum("email_type", [
  "document_request",
  "follow_up_reminder",
  "docs_received_confirmation",
  "ready_to_file_notice",
]);

export const emailStatusEnum = pgEnum("email_status", [
  "sent",
  "failed",
  "bounced",
]);

// ─── Users (CA / Tax Professional) ───────────────────────────────────────────
// Synced from Clerk — clerk_id is the source of truth

export const users = pgTable("users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  clerkId:      text("clerk_id").notNull().unique(),
  email:        text("email").notNull(),          // CA's Gmail — used as Reply-To
  name:         text("name"),
  firmName:     text("firm_name"),
  sandboxToken: text("sandbox_token"),            // console.sandbox.co.in API token
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});

// ─── Clients ──────────────────────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Identity
  name:            text("name").notNull(),
  gstin:           text("gstin").notNull(),
  email:           text("email"),                 // client's email — where we send emails
  phone:           text("phone"),

  // Filing state
  status:          clientStatusEnum("status").default("added").notNull(),
  pendingReturns:  integer("pending_returns").default(0).notNull(),
  filingPeriods:   jsonb("filing_periods"),       // raw data from sandbox API

  // Document tracking
  docsTotal:       integer("docs_total").default(0).notNull(),
  docsReceived:    integer("docs_received").default(0).notNull(),

  // Follow-up tracking
  reminderCount:   integer("reminder_count").default(0).notNull(),
  lastReminderAt:  timestamp("last_reminder_at"),
  autoReminders:   boolean("auto_reminders").default(true).notNull(),

  // Upload link
  uploadToken:     text("upload_token").unique(),  // UUID token for client upload link

  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});

// ─── Email Logs ───────────────────────────────────────────────────────────────

export const emailLogs = pgTable("email_logs", {
  id:          uuid("id").primaryKey().defaultRandom(),
  clientId:    uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  userId:      uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  type:        emailTypeEnum("type").notNull(),
  status:      emailStatusEnum("status").notNull(),

  toEmail:     text("to_email").notNull(),
  fromEmail:   text("from_email").notNull(),     // e.g. notifications@yourdomain.com
  replyTo:     text("reply_to"),                 // CA's Gmail

  resendId:    text("resend_id"),                // Resend message ID for tracking
  subject:     text("subject").notNull(),
  errorMsg:    text("error_msg"),

  sentAt:      timestamp("sent_at").defaultNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type User        = typeof users.$inferSelect;
export type NewUser     = typeof users.$inferInsert;
export type Client      = typeof clients.$inferSelect;
export type NewClient   = typeof clients.$inferInsert;
export type EmailLog    = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;