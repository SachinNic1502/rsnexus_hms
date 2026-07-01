import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const dischargeSchema = z.object({
  status: z.literal("discharged"),
  dischargeSummary: z.string().optional(),
  finalDiagnosis: z.string().optional(),
  followUpDate: z.string().optional(),
})

const updateSchema = z.object({
  doctorId: z.string().optional(),
  wardId: z.string().optional(),
  roomId: z.string().optional(),
  bedId: z.string().optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: "No fields to update" })

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admission = await prisma.admission.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        ward: true,
        room: true,
        bed: true,
        dailyRounds: {
          orderBy: { date: "desc" },
          take: 10,
        },
        invoices: {
          include: { items: true, payments: true },
        },
      },
    })

    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 })
    }

    return NextResponse.json(admission)
  } catch (error) {
    console.error("GET admission error:", error)
    return NextResponse.json({ error: "Failed to fetch admission" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.status === "discharged") {
      const parsed = dischargeSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid discharge data", details: parsed.error.issues }, { status: 400 })
      }

      const admission = await prisma.admission.findUnique({
        where: { id },
        include: {
          room: true,
          ward: true,
          patient: true,
          doctor: { include: { user: true } },
          invoices: { include: { items: true } },
        },
      })

      if (!admission) {
        return NextResponse.json({ error: "Admission not found" }, { status: 404 })
      }

      const admissionDate = new Date(admission.admissionDate)
      const dischargeDate = new Date()
      const daysAdmitted = Math.max(1, Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)))
      const roomCharges = admission.room.chargesPerDay * daysAdmitted

      const existingInvoice = admission.invoices.find((inv) => inv.type === "IPD")
      let invoiceId: string

      if (existingInvoice) {
        const roomItemExists = existingInvoice.items.some(
          (item) => item.description.includes("Room Charges")
        )

        if (!roomItemExists) {
          await prisma.invoiceItem.create({
            data: {
              invoiceId: existingInvoice.id,
              description: `Room Charges (${admission.room.roomNumber}) - ${daysAdmitted} days @ ₹${admission.room.chargesPerDay}/day`,
              quantity: daysAdmitted,
              unitPrice: admission.room.chargesPerDay,
              total: roomCharges,
              type: "room",
            },
          })

          const allItems = await prisma.invoiceItem.findMany({
            where: { invoiceId: existingInvoice.id },
          })
          const subtotal = allItems.reduce((sum, item) => sum + item.total, 0)
          await prisma.invoice.update({
            where: { id: existingInvoice.id },
            data: { subtotal, total: subtotal + existingInvoice.tax - existingInvoice.discount },
          })
        }
        invoiceId = existingInvoice.id
      } else {
        const invoiceNumber = `IPD-${Date.now().toString(36).toUpperCase()}`
        const newInvoice = await prisma.invoice.create({
          data: {
            patientId: admission.patientId,
            admissionId: admission.id,
            invoiceNumber,
            type: "IPD",
            subtotal: roomCharges,
            tax: 0,
            discount: 0,
            total: roomCharges,
          },
        })

        await prisma.invoiceItem.create({
          data: {
            invoiceId: newInvoice.id,
            description: `Room Charges (${admission.room.roomNumber}) - ${daysAdmitted} days @ ₹${admission.room.chargesPerDay}/day`,
            quantity: daysAdmitted,
            unitPrice: admission.room.chargesPerDay,
            total: roomCharges,
            type: "room",
          },
        })

        invoiceId = newInvoice.id
      }

      const [updatedAdmission] = await prisma.$transaction([
        prisma.admission.update({
          where: { id },
          data: {
            status: "discharged",
            dischargeDate: dischargeDate,
            dischargeSummary: parsed.data.dischargeSummary || null,
            finalDiagnosis: parsed.data.finalDiagnosis || null,
            followUpDate: parsed.data.followUpDate ? new Date(parsed.data.followUpDate) : null,
          },
          include: {
            patient: true,
            doctor: { include: { user: true } },
            ward: true,
            room: true,
            bed: true,
          },
        }),
        prisma.bed.update({
          where: { id: admission.bedId },
          data: { status: "available", currentPatientId: null },
        }),
      ])

      return NextResponse.json({ ...updatedAdmission, invoiceId })
    }

    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update data", details: parsed.error.issues }, { status: 400 })
    }

    const admission = await prisma.admission.update({
      where: { id },
      data: parsed.data,
      include: {
        patient: true,
        doctor: { include: { user: true } },
        ward: true,
        room: true,
        bed: true,
      },
    })

    return NextResponse.json(admission)
  } catch (error) {
    console.error("PUT admission error:", error)
    return NextResponse.json({ error: "Failed to update admission" }, { status: 500 })
  }
}
