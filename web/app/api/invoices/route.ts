import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { invoiceSchema, invoiceItemSchema } from "@/lib/validations"
import { handleApiError } from "@/lib/error-handler"
import type { InvoiceWhereInput } from "@/lib/types"
import { getToken } from "next-auth/jwt"

const billingRoles = ["super_admin", "hospital_admin", "billing_staff"]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const patientId = searchParams.get("patientId")
    const appointmentId = searchParams.get("appointmentId")

    const where: InvoiceWhereInput = {}
    where.isDeleted = false

    if (status && status !== "all") {
      where.status = status as 'pending' | 'partial' | 'paid' | 'cancelled'
    }
    if (type) {
      where.type = type as 'OPD' | 'IPD'
    }
    if (patientId) {
      where.patientId = patientId
    }
    if (appointmentId) {
      where.appointmentId = appointmentId
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        patient: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    })

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
