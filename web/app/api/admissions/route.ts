import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { admissionSchema } from "@/lib/validations"
import { handleApiError } from "@/lib/error-handler"
import type { AdmissionWhereInput } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: AdmissionWhereInput = {}
    where.isDeleted = false

    if (status && status !== "all") {
      where.status = status as 'admitted' | 'discharged'
    }

    const admissions = await prisma.admission.findMany({
      where,
      include: {
        patient: true,
        doctor: { include: { user: true } },
        ward: true,
        room: true,
        bed: true,
      },
      orderBy: { admissionDate: "desc" },
    })

    return NextResponse.json(admissions)
  } catch (error) {
    return handleApiError(error, "GET admissions")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = admissionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { patientId, doctorId, wardId, roomId, bedId } = parsed.data

    const lastAdmission = await prisma.admission.findFirst({
      orderBy: { admissionDate: "desc" },
      select: { admissionNumber: true },
    })

    let nextNumber = 1
    if (lastAdmission) {
      const match = lastAdmission.admissionNumber.match(/(\d+)$/)
      if (match) nextNumber = parseInt(match[1]) + 1
    }
    const admissionNumber = `ADM-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`

    const [admission] = await prisma.$transaction([
      prisma.admission.create({
        data: {
          patientId,
          doctorId,
          wardId,
          roomId,
          bedId,
          admissionNumber,
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
        where: { id: bedId },
        data: { status: "occupied", currentPatientId: patientId },
      }),
    ])

    return NextResponse.json(admission, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST admission")
  }
}
