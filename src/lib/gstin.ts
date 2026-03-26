// GSTIN format: 2 digit state code + 10 char PAN + 1 entity number + 1 Z + 1 checksum
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export function validateGSTIN(gstin: string): { valid: boolean; error?: string } {
  const upper = gstin.trim().toUpperCase()

  if (upper.length !== 15) {
    return { valid: false, error: "GSTIN must be exactly 15 characters" }
  }

  if (!GSTIN_REGEX.test(upper)) {
    return { valid: false, error: "Invalid GSTIN format" }
  }

  return { valid: true }
}

export function formatGSTIN(gstin: string): string {
  return gstin.trim().toUpperCase()
}

export function getStateFromGSTIN(gstin: string): string {
  const code = gstin.substring(0, 2)
  return STATE_CODES[code] ?? `State code ${code}`
}

const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
  "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam",
  "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
  "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "27": "Maharashtra", "29": "Karnataka", "30": "Goa",
  "32": "Kerala", "33": "Tamil Nadu", "36": "Telangana",
  "37": "Andhra Pradesh", "27": "Maharashtra",
}