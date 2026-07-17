import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        appointment: true,
        prescription: { include: { medicines: true } },
        labOrders: { include: { tests: true, report: true } },
      },
    })

    if (!consultation) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 })
    }

    return NextResponse.json(consultation)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch consultation" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Parse a numeric vital: "" (cleared) -> null so Prisma unsets it, a valid
    // value -> the number, and an absent field -> undefined (leave unchanged).
    // Using truthiness alone would turn a cleared field into `undefined` and
    // silently keep the old reading, and would also drop a legitimate 0.
    const num = (v: unknown, int = false): number | null | undefined => {
      if (v === undefined) return undefined
      if (v === "" || v === null) return null
      const n = int ? parseInt(v as string) : parseFloat(v as string)
      return Number.isNaN(n) ? null : n
    }

    const consultation = await prisma.consultation.update({
      where: { id },
      data: {
        chiefComplaint: body.chiefComplaint,
        symptoms: body.symptoms,
        diagnosis: body.diagnosis,
        temperature: num(body.temperature),
        bloodPressure: body.bloodPressure,
        pulse: num(body.pulse, true),
        respiratoryRate: num(body.respiratoryRate, true),
        oxygenSaturation: num(body.oxygenSaturation, true),
        weight: num(body.weight),
        height: num(body.height),
        clinicalNotes: body.clinicalNotes,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    })

    return NextResponse.json(consultation)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update consultation" }, { status: 500 })
  }
}
