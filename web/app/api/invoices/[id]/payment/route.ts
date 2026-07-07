import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getAuthUser } from "@/lib/api-utils"
import { createAuditLog } from "@/lib/audit"

const paymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["cash", "card", "upi", "bank_transfer", "insurance"]),
  transactionId: z.string().optional().or(z.literal("")),
  receivedBy: z.string().optional().or(z.literal("")),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { amount, method, transactionId, receivedBy } = parsed.data

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true, patient: true },
    })
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
    const remaining = invoice.total - totalPaid
    if (amount > remaining) {
      return NextResponse.json({ error: `Amount exceeds remaining balance of ₹${remaining}` }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount,
        method,
        transactionId: transactionId || undefined,
        receivedBy: receivedBy || "System",
      },
    })

    const newTotalPaid = totalPaid + amount
    let newStatus: 'pending' | 'partial' | 'paid' = "pending"
    if (newTotalPaid >= invoice.total) {
      newStatus = "paid"
    } else if (newTotalPaid > 0) {
      newStatus = "partial"
    }

    await prisma.invoice.update({
      where: { id },
      data: {
        status: newStatus,
        paidAt: newStatus === "paid" ? new Date() : undefined,
      },
    })

    const authUser = await getAuthUser(request)
    if (authUser) {
      await createAuditLog({
        userId: authUser.id,
        action: "PAYMENT",
        details: `Processed payment of ₹${amount.toLocaleString()} via ${method} for invoice ${invoice.invoiceNumber} (Patient: ${invoice.patient.name}). New Invoice Status: ${newStatus.toUpperCase()}`,
      })
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error("POST payment error:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}
