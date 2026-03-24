import { Resend } from "resend";
import { db } from "@/lib/db";
import { emailLogs, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const resend = new Resend(process.env.RESEND_API_KEY!);

// ─── Config ───────────────────────────────────────────────────────────────────

// The verified domain you set up in Resend dashboard.
// e.g. "TaxFlow <notifications@taxflow.in>"
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "TaxFlow <notifications@taxflow.in>";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailType =
  | "document_request"
  | "follow_up_reminder"
  | "docs_received_confirmation"
  | "ready_to_file_notice";

interface SendEmailParams {
  type:        EmailType;
  clientId:    string;
  userId:      string;
  caEmail:     string;   // CA's Gmail — set as Reply-To
  caName:      string;
  clientName:  string;
  clientEmail: string;
  gstin:       string;
  uploadLink?: string;   // for document_request & follow_up_reminder
  pendingReturns?: number;
}

// ─── Templates ────────────────────────────────────────────────────────────────

function getSubject(type: EmailType, clientName: string): string {
  const map: Record<EmailType, string> = {
    document_request:           `Action Required: Documents needed for GST filing — ${clientName}`,
    follow_up_reminder:         `Reminder: Pending documents for GST filing — ${clientName}`,
    docs_received_confirmation: `Documents Received — ${clientName}`,
    ready_to_file_notice:       `Your GST Return is Ready to File — ${clientName}`,
  };
  return map[type];
}

function baseLayout(content: string, caName: string, caEmail: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TaxFlow</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#2C2416;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="color:#F5F0E8;font-size:18px;font-weight:bold;">T</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="font-family:Georgia,serif;font-size:20px;color:#2C2416;font-weight:600;">TaxFlow</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FDFAF4;border:1px solid #D9CEB8;border-radius:16px;padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#7A6E60;">
                Sent by ${caName} via TaxFlow &nbsp;·&nbsp;
                <a href="mailto:${caEmail}" style="color:#8B6F47;text-decoration:none;">${caEmail}</a>
              </p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#C5B99A;">
                © 2026 TaxFlow · Built for CA firms &amp; tax professionals
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function documentRequestHtml(params: SendEmailParams): string {
  const content = `
    <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:26px;color:#2C2416;font-weight:600;">
      Documents Required
    </h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:#7A6E60;">for your GST filing</p>

    <p style="margin:0 0 16px 0;font-size:15px;color:#2C2416;line-height:1.6;">
      Dear <strong>${params.clientName}</strong>,
    </p>
    <p style="margin:0 0 16px 0;font-size:15px;color:#2C2416;line-height:1.6;">
      We are preparing your GST return and require the following documents.
      Please upload them using the secure link below at your earliest convenience.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin:24px 0;">
      <tr>
        <td style="background:#EDE5D4;border-radius:10px;padding:16px 20px;">
          <p style="margin:0 0 4px 0;font-size:12px;color:#8B6F47;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">GSTIN</p>
          <p style="margin:0;font-size:15px;color:#2C2416;font-family:monospace;">${params.gstin}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px 0;font-size:13px;color:#7A6E60;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
      DOCUMENTS NEEDED
    </p>
    <ul style="margin:0 0 24px 0;padding-left:20px;color:#2C2416;font-size:14px;line-height:1.8;">
      <li>Purchase invoices (inward supplies)</li>
      <li>Sales invoices (outward supplies)</li>
      <li>Bank statements for the filing period</li>
      <li>Any credit/debit notes</li>
    </ul>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px 0;">
      <tr>
        <td align="center">
          <a href="${params.uploadLink}" style="display:inline-block;background:#2C2416;color:#F5F0E8;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:100px;">
            Upload Documents →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#7A6E60;line-height:1.6;">
      If you have any questions, simply reply to this email and we'll get back to you promptly.
    </p>
  `;
  return baseLayout(content, params.caName, params.caEmail);
}

function followUpReminderHtml(params: SendEmailParams): string {
  const content = `
    <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:26px;color:#2C2416;font-weight:600;">
      Friendly Reminder
    </h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:#7A6E60;">documents still pending</p>

    <p style="margin:0 0 16px 0;font-size:15px;color:#2C2416;line-height:1.6;">
      Dear <strong>${params.clientName}</strong>,
    </p>
    <p style="margin:0 0 16px 0;font-size:15px;color:#2C2416;line-height:1.6;">
      This is a gentle reminder that we are still awaiting your documents for GST filing.
      To avoid any delays or penalties, please upload them as soon as possible.
    </p>

    ${params.pendingReturns ? `
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0 24px 0;">
      <tr>
        <td style="background:#F5ECD9;border:1px solid #E5C99A;border-radius:10px;padding:16px 20px;">
          <p style="margin:0;font-size:14px;color:#8B5A1C;">
            ⚠️ &nbsp;<strong>${params.pendingReturns} pending return${params.pendingReturns > 1 ? "s" : ""}</strong> identified for GSTIN <span style="font-family:monospace;">${params.gstin}</span>
          </p>
        </td>
      </tr>
    </table>
    ` : ""}

    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px 0;">
      <tr>
        <td align="center">
          <a href="${params.uploadLink}" style="display:inline-block;background:#C17F3C;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:100px;">
            Upload Now →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#7A6E60;line-height:1.6;">
      If you have already uploaded the documents, please ignore this message.
      For assistance, reply to this email.
    </p>
  `;
  return baseLayout(content, params.caName, params.caEmail);
}

function docsReceivedHtml(params: SendEmailParams): string {
  const content = `
    <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:26px;color:#2C2416;font-weight:600;">
      Documents Received ✓
    </h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:#7A6E60;">thank you for your prompt submission</p>

    <p style="margin:0 0 16px 0;font-size:15px;color:#2C2416;line-height:1.6;">
      Dear <strong>${params.clientName}</strong>,
    </p>
    <p style="margin:0 0 24px 0;font-size:15px;color:#2C2416;line-height:1.6;">
      We have successfully received all the required documents for your GST filing.
      Our team will now begin processing your return.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px 0;">
      <tr>
        <td style="background:#EAF0EA;border:1px solid #B8D4B8;border-radius:10px;padding:16px 20px;">
          <p style="margin:0;font-size:14px;color:#3A5A3A;">
            ✓ &nbsp;All documents verified for GSTIN <span style="font-family:monospace;">${params.gstin}</span>
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#7A6E60;line-height:1.6;">
      We will notify you once your return is ready for review and filing.
      For any questions, reply to this email.
    </p>
  `;
  return baseLayout(content, params.caName, params.caEmail);
}

function readyToFileHtml(params: SendEmailParams): string {
  const content = `
    <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:26px;color:#2C2416;font-weight:600;">
      Ready to File
    </h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:#7A6E60;">your GST return is prepared</p>

    <p style="margin:0 0 16px 0;font-size:15px;color:#2C2416;line-height:1.6;">
      Dear <strong>${params.clientName}</strong>,
    </p>
    <p style="margin:0 0 24px 0;font-size:15px;color:#2C2416;line-height:1.6;">
      Great news — your GST return has been prepared and is ready for filing.
      Please review the details and confirm so we can proceed.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px 0;">
      <tr>
        <td style="background:#EDE5D4;border-radius:10px;padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#7A6E60;padding-bottom:8px;">GSTIN</td>
              <td style="font-size:13px;color:#2C2416;font-family:monospace;text-align:right;">${params.gstin}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#7A6E60;border-top:1px solid #D9CEB8;padding-top:8px;">Status</td>
              <td style="font-size:13px;color:#3A5A3A;font-weight:600;text-align:right;border-top:1px solid #D9CEB8;padding-top:8px;">Ready to File ✓</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#7A6E60;line-height:1.6;">
      Please reply to this email to confirm you'd like us to proceed with filing,
      or if you have any changes to request.
    </p>
  `;
  return baseLayout(content, params.caName, params.caEmail);
}

function getHtml(params: SendEmailParams): string {
  switch (params.type) {
    case "document_request":           return documentRequestHtml(params);
    case "follow_up_reminder":         return followUpReminderHtml(params);
    case "docs_received_confirmation": return docsReceivedHtml(params);
    case "ready_to_file_notice":       return readyToFileHtml(params);
  }
}

// ─── Core send function ───────────────────────────────────────────────────────

export async function sendClientEmail(params: SendEmailParams): Promise<{
  success: boolean;
  resendId?: string;
  error?: string;
}> {
  const subject = getSubject(params.type, params.clientName);
  const html    = getHtml(params);

  let resendId: string | undefined;
  let status: "sent" | "failed" = "sent";
  let errorMsg: string | undefined;

  try {
    const { data, error } = await resend.emails.send({
      from:     FROM_ADDRESS,
      to:       [params.clientEmail],
      replyTo:  params.caEmail,          // CA's Gmail — client replies go here
      subject,
      html,
    });

    if (error) throw new Error(error.message);
    resendId = data?.id;
  } catch (err) {
    status   = "failed";
    errorMsg = err instanceof Error ? err.message : "Unknown error";
  }

  // Log every attempt regardless of success/failure
  await db.insert(emailLogs).values({
    clientId:  params.clientId,
    userId:    params.userId,
    type:      params.type,
    status,
    toEmail:   params.clientEmail,
    fromEmail: FROM_ADDRESS,
    replyTo:   params.caEmail,
    resendId,
    subject,
    errorMsg,
  });

  // Update reminder count + last reminder timestamp on the client
  if (
    status === "sent" &&
    (params.type === "document_request" || params.type === "follow_up_reminder")
  ) {
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, params.clientId),
    });
    if (client) {
      await db
        .update(clients)
        .set({
          reminderCount:  client.reminderCount + 1,
          lastReminderAt: new Date(),
          updatedAt:      new Date(),
        })
        .where(eq(clients.id, params.clientId));
    }
  }

  if (status === "failed") return { success: false, error: errorMsg };
  return { success: true, resendId };
}