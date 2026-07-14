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

      const dischargeDate = new Date()

      // NOTE: The IPD invoice is intentionally NOT created here. Invoice
      // generation is owned by the dedicated `/api/invoices/auto-ipd` endpoint
      // (called by the discharge page right after this update), which builds the
      // full bill — room charges, doctor-visit charges, procedures, lab tests
      // and any extra charges. Creating a room-only invoice here would make
      // auto-ipd return 409 ("IPD invoice already exists") and the richer bill
      // would never be generated. Any IPD invoice that already exists is left
      // untouched so auto-ipd's own dedup guard remains the single authority.
      const existingInvoice = admission.invoices.find((inv) => inv.type === "IPD")

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

      // Complete the originating OPD consultation (Phase 6): when the doctor
      // discharges the patient, the appointment that led to this admission is
      // marked completed. Best-effort — never blocks the discharge itself.
      if (admission.appointmentId) {
        try {
          await prisma.appointment.update({
            where: { id: admission.appointmentId },
            data: { status: "completed" },
          })
        } catch (e) {
          console.error("Failed to complete originating appointment on discharge:", e)
        }
      }

      return NextResponse.json({ ...updatedAdmission, invoiceId: existingInvoice?.id ?? null })
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
