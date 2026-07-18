import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"

const billingRoles = ["super_admin", "hospital_admin", "billing_staff", "nurse"]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        admission: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Patient is resolved separately — some invoices point at a patientId
    // whose Patient no longer exists, and Prisma's include throws "Field
    // patient is required ... got null" the moment one of those is touched.
    // Unlike clinical records, an invoice still represents real money owed
    // or collected, so it's never hidden here — a fallback name is used
    // instead of 404ing an otherwise-valid, payable invoice.
    const patient = await prisma.patient.findUnique({ where: { id: invoice.patientId } })

    return NextResponse.json({ ...invoice, patient: patient ?? { name: "Unknown patient", uhid: "-" } })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !billingRoles.includes(token.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Recompute total whenever tax/discount change — the subtotal is fixed by
    // the line items, so total = subtotal + tax - discount must be kept in sync.
    const tax = typeof body.tax === "number" ? body.tax : existing.tax
    const discount = typeof body.discount === "number" ? body.discount : existing.discount

    if (discount < 0 || tax < 0) {
      return NextResponse.json({ error: "Tax and discount cannot be negative" }, { status: 400 })
    }
    if (discount > existing.subtotal + tax) {
      return NextResponse.json({ error: "Discount cannot exceed subtotal + tax" }, { status: 400 })
    }

    const total = existing.subtotal + tax - discount

    const data: {
      tax: number
      discount: number
      total: number
      status?: "pending" | "partial" | "paid" | "cancelled"
    } = { tax, discount, total }
    // Only allow status changes to/from cancelled here; paid/partial are derived
    // from recorded payments in the payment route, never set manually.
    if (body.status === "cancelled" || body.status === "pending") {
      data.status = body.status
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data,
      include: {
        items: true,
        payments: true,
      },
    })

    const patient = await prisma.patient.findUnique({ where: { id: invoice.patientId } })

    return NextResponse.json({ ...invoice, patient: patient ?? { name: "Unknown patient", uhid: "-" } })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}
