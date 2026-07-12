import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const consultationSchema = z.object({
  appointmentId: z.string().optional().or(z.literal("")),
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  chiefComplaint: z.string().optional().or(z.literal("")),
  symptoms: z.string().optional().or(z.literal("")),
  diagnosis: z.string().optional().or(z.literal("")),
  temperature: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined ? undefined : parseFloat(String(v))),
  bloodPressure: z.string().optional().or(z.literal("")),
  pulse: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined ? undefined : parseInt(String(v), 10)),
  respiratoryRate: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined ? undefined : parseInt(String(v), 10)),
  oxygenSaturation: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined ? undefined : parseInt(String(v), 10)),
  weight: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined ? undefined : parseFloat(String(v))),
  height: z.union([z.number(), z.string()]).optional().transform(v => v === '' || v === undefined ? undefined : parseFloat(String(v))),
  clinicalNotes: z.string().optional().or(z.literal("")),
  markComplete: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const doctorId = searchParams.get("doctorId")

    const where: any = {}
    where.isDeleted = false
    if (patientId) where.patientId = patientId
    if (doctorId) where.doctorId = doctorId

    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        patient: true,
        doctor: { include: { user: true } },
        appointment: true,
        prescription: { include: { medicines: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(consultations)
  } catch (error) {
    console.error("GET consultations error:", error)
    return NextResponse.json({ error: "Failed to fetch consultations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = consultationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { appointmentId, patientId, doctorId, markComplete, ...data } = parsed.data

    const consultationData: any = {
      patientId,
      doctorId,
      ...data,
      temperature: data.temperature ?? undefined,
      bloodPressure: data.bloodPressure || undefined,
      pulse: data.pulse ?? undefined,
      respiratoryRate: data.respiratoryRate ?? undefined,
      oxygenSaturation: data.oxygenSaturation ?? undefined,
      weight: data.weight ?? undefined,
      height: data.height ?? undefined,
      clinicalNotes: data.clinicalNotes || undefined,
    }

    if (appointmentId) {
      consultationData.appointmentId = appointmentId
    }

    const consultation = await prisma.consultation.create({
      data: consultationData,
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    })

    // If markComplete is requested, update appointment status
    if (markComplete && appointmentId) {
      try {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: "completed" },
        })
      } catch (aptErr) {
        console.error("Failed to mark appointment as completed:", aptErr)
        return NextResponse.json(
          { error: "Consultation saved but failed to update appointment status. Please update the appointment manually." },
          { status: 500 }
        )
      }
    }

    // Save vitals back to patient record
    if (patientId) {
      const patientUpdate: any = {}
      if (data.temperature !== undefined) patientUpdate.temperature = data.temperature
      if (data.bloodPressure) patientUpdate.bloodPressure = data.bloodPressure
      if (data.pulse !== undefined) patientUpdate.pulse = data.pulse
      if (data.oxygenSaturation !== undefined) patientUpdate.oxygenSaturation = data.oxygenSaturation
      if (data.weight !== undefined) patientUpdate.weight = data.weight
      if (data.height !== undefined) patientUpdate.height = data.height
      if (Object.keys(patientUpdate).length > 0) {
        await prisma.patient.update({ where: { id: patientId }, data: patientUpdate })
      }
    }

    return NextResponse.json(consultation, { status: 201 })
  } catch (error) {
    console.error("POST consultation error:", error)
    return NextResponse.json({ error: "Failed to create consultation" }, { status: 500 })
  }
}
