// Static checklist definitions per return type.
// Currently GSTR-1 is active. Add more return types here as needed.
// Step 3 (AI) uses these labels to validate uploaded docs.

export type ChecklistTemplate = {
  label: string
  description: string
  required: boolean
  sortOrder: number
}

export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplate[]> = {
  "GSTR-1": [
    {
      label: "B2B Sales Invoices",
      description:
        "All tax invoices issued to GST-registered buyers. Include invoice number, date, buyer GSTIN, taxable value, and GST amount.",
      required: true,
      sortOrder: 1,
    },
    {
      label: "B2C Large Invoices (above ₹2.5L)",
      description:
        "Invoices to unregistered buyers where invoice value exceeds ₹2,50,000. Required for inter-state supplies.",
      required: true,
      sortOrder: 2,
    },
    {
      label: "B2C Small / Aggregate Sales",
      description:
        "Summary of all sales to unregistered buyers below ₹2.5L. Can be a total amount grouped by state.",
      required: true,
      sortOrder: 3,
    },
    {
      label: "Export Invoices",
      description:
        "Invoices for goods or services exported. Mention whether with payment of IGST or under LUT/Bond.",
      required: false,
      sortOrder: 4,
    },
    {
      label: "Credit / Debit Notes",
      description:
        "Any CDNs issued during the period. Include the original invoice reference number and date.",
      required: false,
      sortOrder: 5,
    },
    {
      label: "Advances Received",
      description:
        "Advances received against future supply on which GST is applicable (if any).",
      required: false,
      sortOrder: 6,
    },
  ],

  // Uncomment and fill when enabling additional return types:
  // "GSTR-3B": [ ... ],
  // "GSTR-9":  [ ... ],
  // "GSTR-2B": [ ... ],
}

export function getChecklistForReturn(returnType: string): ChecklistTemplate[] {
  return CHECKLIST_TEMPLATES[returnType] ?? []
}

export const SUPPORTED_RETURN_TYPES = Object.keys(CHECKLIST_TEMPLATES)