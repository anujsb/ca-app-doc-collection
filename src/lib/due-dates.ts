// GST due date logic for GSTR-1 (monthly filers).
// GSTR-1 is due on the 11th of the following month.
// e.g. March 2025 GSTR-1 is due April 11, 2025.
//
// This module generates a list of periods that:
//   1. Are already past their due date (overdue — file immediately)
//   2. Are due within the next 7 days (due soon)
//   3. Are upcoming in the current month (coming up)
//
// The CA can then create a filing for any suggested period in one click.

export type SuggestedFiling = {
  returnType: string
  periodType: "monthly"
  periodLabel: string          // e.g. "Mar 2025"
  dueDate: Date
  urgency: "overdue" | "due_soon" | "upcoming"
  daysUntilDue: number         // negative = overdue
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function periodLabel(year: number, month: number): string {
  // month is 0-indexed
  return `${MONTH_NAMES[month]} ${year}`
}

function gstr1DueDate(filingYear: number, filingMonth: number): Date {
  // Due on 11th of next month
  const due = new Date(filingYear, filingMonth + 1, 11)
  return due
}

export function getSuggestedFilings(
  existingPeriodLabels: string[],  // periods that already have a filing created
  lookbackMonths = 3               // how many past months to surface as overdue
): SuggestedFiling[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const suggestions: SuggestedFiling[] = []

  // Check the last N months + current month
  for (let i = lookbackMonths; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const label = periodLabel(year, month)

    // Skip if CA already created a filing for this period
    if (existingPeriodLabels.includes(label)) continue

    const dueDate = gstr1DueDate(year, month)
    const msPerDay = 1000 * 60 * 60 * 24
    const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / msPerDay)

    let urgency: SuggestedFiling["urgency"]
    if (daysUntilDue < 0)       urgency = "overdue"
    else if (daysUntilDue <= 7) urgency = "due_soon"
    else                        urgency = "upcoming"

    suggestions.push({
      returnType: "GSTR-1",
      periodType: "monthly",
      periodLabel: label,
      dueDate,
      urgency,
      daysUntilDue,
    })
  }

  return suggestions
}

export function formatDueLabel(s: SuggestedFiling): string {
  if (s.urgency === "overdue") {
    const days = Math.abs(s.daysUntilDue)
    return `${days}d overdue`
  }
  if (s.urgency === "due_soon") {
    return s.daysUntilDue === 0 ? "Due today" : `Due in ${s.daysUntilDue}d`
  }
  return `Due ${s.dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
}