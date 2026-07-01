import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/error-handler"

export async function POST(request: NextRequest) {
  try {
    const { consultationId, extraCharges = [] } = await request.json()
    if (!consultationId) {
      return NextResponse.json({ error: "consultationId is required" }, { status: 400 })
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        appointment: true,
        prescription: { include: { medicines: true } },
        labOrders: { include: { tests: true } },
      },
    })

    if (!consultation) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 })
    }

    const items: { description: string; quantity: number; unitPrice: number; type: string }[] = []

    // 1. Consultation Fee
    const consultationFeeService = await prisma.service.findFirst({
      where: { name: { equals: "Consultation Fee", mode: "insensitive" }, isActive: true },
    })
    if (consultationFeeService) {
      items.push({
        description: `Consultation - Dr. ${consultation.doctor.user.name}`,
        quantity: 1,
        unitPrice: consultationFeeService.price,
        type: "service",
      })
    }

    // 2. Medicines from prescription
    if (consultation.prescription?.medicines) {
      for (const med of consultation.prescription.medicines) {
        let price = 0
        if (med.medicineId) {
          const medicine = await prisma.medicine.findUnique({ where: { id: med.medicineId } })
          if (medicine) price = medicine.price
        }
        if (price > 0) {
          items.push({
            description: `${med.medicineName} - ${med.dose} (${med.frequency}, ${med.duration})`,
            quantity: 1,
            unitPrice: price,
            type: "medicine",
          })
        }
      }
    }

    // 3. Lab Tests ordered for this consultation
    if (consultation.labOrders) {
      for (const order of consultation.labOrders) {
        for (const test of order.tests) {
          items.push({
            description: `Lab: ${test.testName}`,
            quantity: 1,
            unitPrice: test.price,
            type: "lab",
          })
        }
      }
    }

    // 4. Extra charges added by doctor
    if (Array.isArray(extraCharges)) {
      for (const charge of extraCharges) {
        if (charge.description && charge.unitPrice > 0) {
          items.push({
            description: charge.description,
            quantity: charge.quantity || 1,
            unitPrice: charge.unitPrice,
            type: charge.type || "service",
          })
        }
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "No billable items found for this consultation" }, { status: 400 })
    }

    // Generate invoice number
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

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    const invoice = await prisma.invoice.create({
      data: {
        patientId: consultation.patientId,
        appointmentId: consultation.appointmentId || null,
        invoiceNumber,
        type: "OPD",
        subtotal,
        tax: 0,
        discount: 0,
        total: subtotal,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            type: item.type as "service" | "medicine" | "lab" | "room" | "other",
          })),
        },
      },
      include: {
        patient: true,
        items: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST auto-opd invoice")
  }
}
