import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updatePrescriptionSchema = z.object({
  medicines: z.array(z.object({
    id: z.string().min(1, "Medicine line id is required"),
    timing: z.string().optional().or(z.literal("")),
    foodInstructions: z.string().optional().or(z.literal("")),
    usageInstructions: z.string().optional().or(z.literal("")),
  })).min(1, "At least one medicine is required"),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true } },
        consultation: true,
        medicines: true,
      },
    })

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 })
    }

    // Patient is resolved separately — some prescriptions point at a
    // patientId whose Patient no longer exists, and Prisma's include throws
    // "Field patient is required ... got null" the moment one of those is
    // touched.
    const patient = await prisma.patient.findUnique({ where: { id: prescription.patientId } })
    if (!patient) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 })
    }

    return NextResponse.json({ ...prescription, patient })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prescription" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updatePrescriptionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const prescription = await prisma.prescription.findUnique({ where: { id } })
    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 })
    }

    await Promise.all(
      parsed.data.medicines.map((m) =>
        prisma.prescriptionMedicine.update({
          where: { id: m.id },
          data: {
            timing: m.timing || undefined,
            foodInstructions: m.foodInstructions || undefined,
            usageInstructions: m.usageInstructions || undefined,
          },
        })
      )
    )

    const updated = await prisma.prescription.findUnique({
      where: { id },
      include: { doctor: { include: { user: true } }, consultation: true, medicines: true },
    })

    const patient = updated ? await prisma.patient.findUnique({ where: { id: updated.patientId } }) : null

    return NextResponse.json(updated ? { ...updated, patient } : updated)
  } catch (error) {
    console.error("PUT prescription error:", error)
    return NextResponse.json({ error: "Failed to update prescription" }, { status: 500 })
  }
}
