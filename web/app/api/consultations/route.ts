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
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const doctorId = searchParams.get("doctorId")

    const where: any = {}
    if (patientId) where.patientId = patientId
    if (doctorId) where.doctorId = doctorId

    // Patient is resolved separately — some consultations point at a
    // patientId whose Patient no longer exists, and Prisma's include throws
    // "Field patient is required ... got null" the moment one of those is
    // touched (patient is a required relation, unlike the optional
    // `appointment` one below, which safely returns null on its own).
    const rawConsultations = await prisma.consultation.findMany({
      where,
      include: {
        doctor: { include: { user: true } },
        appointment: true,
        prescription: { include: { medicines: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const patientIds = [...new Set(rawConsultations.map((c) => c.patientId))]
    const patients = await prisma.patient.findMany({ where: { id: { in: patientIds } } })
    const patientById = new Map(patients.map((p) => [p.id, p]))

    const consultations = rawConsultations
      .filter((c) => patientById.has(c.patientId))
      .map((c) => ({ ...c, patient: patientById.get(c.patientId)! }))

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

    const { appointmentId, patientId, doctorId, ...data } = parsed.data

    const consultationData: any = {
      patientId,
      doctorId,
      ...data,
      chiefComplaint: data.chiefComplaint || "",
      symptoms: data.symptoms || "",
      diagnosis: data.diagnosis || "",
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

    return NextResponse.json(consultation, { status: 201 })
  } catch (error) {
    console.error("POST consultation error:", error)
    return NextResponse.json({ error: "Failed to create consultation" }, { status: 500 })
  }
}
