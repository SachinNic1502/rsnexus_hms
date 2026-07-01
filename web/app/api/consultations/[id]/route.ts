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

    const consultation = await prisma.consultation.update({
      where: { id },
      data: {
        chiefComplaint: body.chiefComplaint,
        symptoms: body.symptoms,
        diagnosis: body.diagnosis,
        temperature: body.temperature ? parseFloat(body.temperature) : undefined,
        bloodPressure: body.bloodPressure,
        pulse: body.pulse ? parseInt(body.pulse) : undefined,
        respiratoryRate: body.respiratoryRate ? parseInt(body.respiratoryRate) : undefined,
        oxygenSaturation: body.oxygenSaturation ? parseInt(body.oxygenSaturation) : undefined,
        weight: body.weight ? parseFloat(body.weight) : undefined,
        height: body.height ? parseFloat(body.height) : undefined,
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
