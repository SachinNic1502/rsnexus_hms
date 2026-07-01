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
