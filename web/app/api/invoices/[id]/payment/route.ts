import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { z } from "zod"

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
      include: { payments: true },
    })
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json({ error: "Cannot record a payment against a cancelled invoice" }, { status: 400 })
    }

    // Round money to 2 decimals to avoid float drift when comparing against the
    // remaining balance and deciding paid/partial status.
    const round2 = (n: number) => Math.round(n * 100) / 100
    const totalPaid = round2(invoice.payments.reduce((sum, p) => sum + p.amount, 0))
    const remaining = round2(invoice.total - totalPaid)
    if (remaining <= 0) {
      return NextResponse.json({ error: "Invoice is already fully paid" }, { status: 400 })
    }
    if (round2(amount) > remaining) {
      return NextResponse.json({ error: `Amount exceeds remaining balance of ₹${remaining}` }, { status: 400 })
    }

    // Record who actually took the payment from the session, not the client.
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    const receiver =
      (receivedBy && receivedBy.trim()) ||
      (token?.name as string) ||
      (token?.email as string) ||
      (token?.id as string) ||
      "System"

    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount,
        method,
        transactionId: transactionId || undefined,
        receivedBy: receiver,
      },
    })

    const newTotalPaid = round2(totalPaid + amount)
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

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error("POST payment error:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}
