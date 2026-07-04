import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const prescriptionMedicineSchema = z.object({
  medicineId: z.string().optional().or(z.literal("")),
  medicineName: z.string().min(1, "Medicine name is required").optional(),
  name: z.string().min(1, "Medicine name is required").optional(),
  dose: z.string().optional().or(z.literal("")),
  frequency: z.string().optional().or(z.literal("")),
  duration: z.string().optional().or(z.literal("")),
  instructions: z.string().optional().or(z.literal("")),
}).refine(data => data.medicineName || data.name, { message: "Medicine name is required" })

const prescriptionSchema = z.object({
  consultationId: z.string().optional().or(z.literal("")),
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  medicines: z.array(prescriptionMedicineSchema).min(1, "At least one medicine required"),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    const where: any = {}
    if (patientId) where.patientId = patientId

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        patient: true,
        doctor: { include: { user: true } },
        consultation: true,
        medicines: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(prescriptions)
  } catch (error) {
    console.error("GET prescriptions error:", error)
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = prescriptionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { consultationId, patientId, doctorId, medicines } = parsed.data

    const medicinesToCreate = []
    for (const m of medicines) {
      const medicineName = m.medicineName || m.name || ""
      let medicineId = m.medicineId || ""

      if (!medicineId && medicineName) {
        let medicine = await prisma.medicine.findFirst({ where: { name: { equals: medicineName, mode: "insensitive" }, isDeleted: { isSet: false } } })
        if (!medicine) {
          medicine = await prisma.medicine.create({ data: { name: medicineName, unit: "tablet", price: 0, stock: 0 } })
        }
        medicineId = medicine.id
      }

      medicinesToCreate.push({
        medicineId,
        medicineName,
        dose: m.dose || "",
        frequency: m.frequency || "",
        duration: m.duration || "",
        instructions: m.instructions || undefined,
      })
    }

    const prescriptionData: any = {
      patientId,
      doctorId,
      medicines: { create: medicinesToCreate },
    }

    if (consultationId) {
      prescriptionData.consultationId = consultationId
    }

    const prescription = await prisma.prescription.create({
      data: prescriptionData,
      include: {
        medicines: true,
        patient: true,
        doctor: { include: { user: true } },
      },
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error) {
    console.error("POST prescription error:", error)
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 })
  }
}
