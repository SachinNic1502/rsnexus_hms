import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { invoiceSchema, invoiceItemSchema } from "@/lib/validations"
import { handleApiError } from "@/lib/error-handler"
import type { InvoiceWhereInput } from "@/lib/types"
import { getToken } from "next-auth/jwt"
import { computeDueDate } from "@/lib/utils"

const billingRoles = ["super_admin", "hospital_admin", "billing_staff", "nurse"]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const patientId = searchParams.get("patientId")

    const where: InvoiceWhereInput = {}
    if (status && status !== "all") {
      where.status = status as 'pending' | 'partial' | 'paid' | 'cancelled'
    }
    if (type) {
      where.type = type as 'OPD' | 'IPD'
    }
    if (patientId) {
      where.patientId = patientId
    }

    // Patient is resolved separately — some invoices point at a patientId
    // whose Patient no longer exists, and Prisma's include throws "Field
    // patient is required ... got null" the moment one of those is touched.
    // Unlike clinical records, an invoice still represents real money owed
    // or collected, so it's never dropped from the list here — a fallback
    // name is used instead of hiding the invoice.
    const rawInvoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const patientIds = [...new Set(rawInvoices.map((i) => i.patientId))]
    const patients = await prisma.patient.findMany({ where: { id: { in: patientIds } } })
    const patientById = new Map(patients.map((p) => [p.id, p]))

    const invoices = rawInvoices.map((i) => ({
      ...i,
      patient: patientById.get(i.patientId) ?? { name: "Unknown patient", uhid: "-" },
    }))

    return NextResponse.json(invoices)
  } catch (error) {
    return handleApiError(error, "GET invoices")
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !billingRoles.includes(token.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = invoiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { patientId, admissionId, appointmentId, type, items, tax, discount } = parsed.data

    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    })

    let nextNumber = 1
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/(\d+)$/)
      if (match) nextNumber = parseInt(match[1]) + 1
    }
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`

    const subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0)
    if (discount > subtotal + tax) {
      return NextResponse.json({ error: "Discount cannot exceed subtotal + tax" }, { status: 400 })
    }
    const total = subtotal + tax - discount

    const invoice = await prisma.invoice.create({
      data: {
        patientId,
        admissionId: admissionId || null,
        appointmentId: appointmentId || null,
        invoiceNumber,
        type,
        subtotal,
        tax,
        discount,
        total,
        dueDate: computeDueDate(),
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            type: item.type,
          })),
        },
      },
      include: {
        patient: true,
        items: true,
        payments: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST invoice")
  }
}
