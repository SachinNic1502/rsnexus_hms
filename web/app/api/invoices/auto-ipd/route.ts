import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/error-handler"
import { computeDueDate } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const { admissionId, extraCharges = [] } = await request.json()
    if (!admissionId) {
      return NextResponse.json({ error: "admissionId is required" }, { status: 400 })
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        ward: true,
        room: true,
        bed: true,
        dailyRounds: true,
        invoices: true,
      },
    })

    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 })
    }

    const hasInvoice = admission.invoices.some(inv => inv.type === "IPD" && inv.status !== "cancelled")
    if (hasInvoice) {
      return NextResponse.json({ error: "IPD invoice already exists for this admission" }, { status: 409 })
    }

    const items: { description: string; quantity: number; unitPrice: number; type: string }[] = []

    // 1. Room charges
    const admissionDate = new Date(admission.admissionDate)
    const endDate = admission.dischargeDate ? new Date(admission.dischargeDate) : new Date()
    const daysAdmitted = Math.max(1, Math.ceil((endDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)))

    // Room charges only apply when a bed was actually allocated (by a nurse).
    // A patient discharged without ever being allocated a bed incurs no room
    // charge, but is still billed for visits / labs / extras below.
    if (admission.room && admission.bed && admission.room.chargesPerDay > 0) {
      items.push({
        description: `${admission.ward?.name ?? "Ward"} - Room ${admission.room.roomNumber}, Bed ${admission.bed.bedNumber} (${admission.room.type})`,
        quantity: daysAdmitted,
        unitPrice: admission.room.chargesPerDay,
        type: "room",
      })
    }

    // 2. Doctor visit charges per day round
    if (admission.dailyRounds.length > 0) {
      const doctorVisitService = await prisma.service.findFirst({
        where: { name: { equals: "Doctor Visit", mode: "insensitive" }, isActive: true },
      })
      const visitCharge = doctorVisitService?.price || 500
      items.push({
        description: `Doctor visits (${admission.dailyRounds.length} rounds) - Dr. ${admission.doctor.user.name}`,
        quantity: admission.dailyRounds.length,
        unitPrice: visitCharge,
        type: "service",
      })
    }

    // 3. Daily round specific charges (procedures, medications administered)
    for (const round of admission.dailyRounds) {
      if (round.notes) {
        const lowerNotes = round.notes.toLowerCase()
        if (lowerNotes.includes('injection') || lowerNotes.includes('inj.')) {
          const injService = await prisma.service.findFirst({
            where: { name: { equals: "Injection", mode: "insensitive" }, isActive: true },
          })
          if (injService) {
            items.push({ description: "Injection administered", quantity: 1, unitPrice: injService.price, type: "service" })
          }
        }
        if (lowerNotes.includes('iv fluid') || lowerNotes.includes('iv drip')) {
          const ivService = await prisma.service.findFirst({
            where: { name: { equals: "IV Fluid", mode: "insensitive" }, isActive: true },
          })
          if (ivService) {
            items.push({ description: "IV Fluid", quantity: 1, unitPrice: ivService.price, type: "service" })
          }
        }
      }
    }

    // 4. Lab tests (fetch lab orders for this patient during admission period)
    const labOrders = await prisma.labOrder.findMany({
      where: {
        patientId: admission.patientId,
        orderedAt: { gte: admissionDate, lte: endDate },
      },
      include: { tests: true },
    })
    for (const order of labOrders) {
      for (const test of order.tests) {
        items.push({
          description: `Lab: ${test.testName}`,
          quantity: 1,
          unitPrice: test.price,
          type: "lab",
        })
      }
    }

    // 5. Extra charges added manually
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
      return NextResponse.json({ error: "No billable items found for this admission" }, { status: 400 })
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
        patientId: admission.patientId,
        admissionId: admission.id,
        invoiceNumber,
        type: "IPD",
        subtotal,
        tax: 0,
        discount: 0,
        total: subtotal,
        dueDate: computeDueDate(),
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
    return handleApiError(error, "POST auto-ipd invoice")
  }
}
