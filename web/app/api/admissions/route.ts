import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { admissionSchema } from "@/lib/validations"
import { handleApiError } from "@/lib/error-handler"
import type { AdmissionWhereInput } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const doctorId = searchParams.get("doctorId")

    const where: AdmissionWhereInput = {}
    if (status && status !== "all") {
      where.status = status as 'admitted' | 'discharged'
    }
    if (doctorId) {
      where.doctorId = doctorId
    }

    // Patient is resolved separately — some admissions point at a patientId
    // whose Patient no longer exists, and Prisma's include throws "Field
    // patient is required ... got null" the moment one of those is touched.
    const rawAdmissions = await prisma.admission.findMany({
      where,
      include: {
        doctor: { include: { user: true } },
        ward: true,
        room: true,
        bed: true,
      },
      orderBy: { admissionDate: "desc" },
    })

    const patientIds = [...new Set(rawAdmissions.map((a) => a.patientId))]
    const patients = await prisma.patient.findMany({ where: { id: { in: patientIds } } })
    const patientById = new Map(patients.map((p) => [p.id, p]))

    const admissions = rawAdmissions
      .filter((a) => patientById.has(a.patientId))
      .map((a) => ({ ...a, patient: patientById.get(a.patientId)! }))

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

    const { patientId, doctorId } = parsed.data
    // Ward / room / bed are optional at admission time. They are normally left
    // empty here (the nurse allocates a bed afterwards), but we still accept
    // them for backward compatibility if a caller provides a full allocation.
    const wardId = parsed.data.wardId || undefined
    const roomId = parsed.data.roomId || undefined
    const bedId = parsed.data.bedId || undefined
    // Optional informational / linkage fields (backward-compatible additions).
    const expectedStayRaw = parsed.data.expectedStayDays
    const expectedStayDays =
      expectedStayRaw === "" || expectedStayRaw === undefined || expectedStayRaw === null
        ? undefined
        : Number.isFinite(Number(expectedStayRaw))
          ? parseInt(String(expectedStayRaw), 10)
          : undefined
    const appointmentId = parsed.data.appointmentId ? parsed.data.appointmentId : undefined
    const consultationId = parsed.data.consultationId ? parsed.data.consultationId : undefined

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

    // Create the admission and — only when a bed was supplied up-front — mark
    // that bed occupied, atomically. Normally no bed is provided here (the
    // nurse allocates one later via Bed Allocation).
    const admission = await prisma.$transaction(async (tx) => {
      const created = await tx.admission.create({
        data: {
          patientId,
          doctorId,
          ...(wardId ? { wardId } : {}),
          ...(roomId ? { roomId } : {}),
          ...(bedId ? { bedId } : {}),
          admissionNumber,
          ...(expectedStayDays !== undefined ? { expectedStayDays } : {}),
          ...(appointmentId ? { appointmentId } : {}),
          ...(consultationId ? { consultationId } : {}),
        },
        include: {
          patient: true,
          doctor: { include: { user: true } },
          ward: true,
          room: true,
          bed: true,
        },
      })

      if (bedId) {
        // Only grab the bed if it is currently available. updateMany returns a
        // count so we can detect a race / already-occupied bed and abort the
        // whole transaction rather than silently double-booking it.
        const grab = await tx.bed.updateMany({
          where: { id: bedId, status: "available" },
          data: { status: "occupied", currentPatientId: patientId },
        })
        if (grab.count === 0) {
          throw new Error("BED_NOT_AVAILABLE")
        }
      }

      return created
    }).catch((e) => {
      if (e instanceof Error && e.message === "BED_NOT_AVAILABLE") return "BED_NOT_AVAILABLE" as const
      throw e
    })

    if (admission === "BED_NOT_AVAILABLE") {
      return NextResponse.json({ error: "Selected bed is no longer available" }, { status: 409 })
    }

    return NextResponse.json(admission, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST admission")
  }
}
