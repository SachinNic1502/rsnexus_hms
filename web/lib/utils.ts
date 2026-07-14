import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate sequential number with prefix (e.g., UHID-2025-001)
export function generateSequentialNumber(prefix: string, lastNumber?: string): string {
  let nextNumber = 1
  if (lastNumber) {
    const match = lastNumber.match(/(\d+)$/)
    if (match) nextNumber = parseInt(match[1]) + 1
  }
  return `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`
}

// Default number of days an invoice is due after its creation date (net-30).
export const INVOICE_DUE_DAYS = 30

// Compute an invoice due date as `from` + net-30 days. Used at invoice
// creation time and as a client-side fallback for invoices with no stored
// dueDate (created before the field existed).
export function computeDueDate(from: Date | string = new Date()): Date {
  const base = typeof from === "string" ? new Date(from) : from
  return new Date(base.getTime() + INVOICE_DUE_DAYS * 24 * 60 * 60 * 1000)
}
