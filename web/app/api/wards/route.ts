import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const wardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["general", "icu", "emergency", "private"]).default("general"),
  floor: z.number().int().min(1).max(50).default(1),
  noOfBeds: z.number().int().min(0, "No. of beds must be positive").max(500).default(0),
})

export async function GET() {
  try {
    const wards = await prisma.ward.findMany({
      where: { OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }] },
      include: {
        rooms: {
          where: { OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }] },
          include: {
            beds: {
              where: { OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }] },
              include: {
                // The bed's current occupant (if any), so the Ward Management
                // screen shows the patient name on occupied beds. A bed has
                // many admissions over its lifetime; only the admitted one is
                // the live occupant. Patient is resolved separately below —
                // some admissions point at a patientId whose Patient no
                // longer exists, and Prisma's include throws "Field patient
                // is required ... got null" the moment one of those is
                // touched.
                admissions: {
                  where: { status: "admitted" },
                  take: 1,
                  include: { doctor: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    const activePatientIds = [
      ...new Set(
        wards.flatMap((ward) => ward.rooms.flatMap((room) => room.beds.flatMap((bed) => bed.admissions.map((a) => a.patientId))))
      ),
    ]
    const activePatients = await prisma.patient.findMany({ where: { id: { in: activePatientIds } } })
    const activePatientById = new Map(activePatients.map((p) => [p.id, p]))

    const wardsWithStats = wards.map((ward) => {
      const allBeds = ward.rooms.flatMap((room) => room.beds)
      const totalBeds = allBeds.length
      const occupiedBeds = allBeds.filter((b) => b.status === "occupied").length
      return {
        ...ward,
        rooms: ward.rooms.map((room) => ({
          ...room,
          beds: room.beds.map((bed) => {
            // Expose the active admission as `admission` (singular) for the
            // Ward Management UI, which reads bed.admission.patient.name.
            const { admissions, ...rest } = bed
            const activeAdmission = admissions[0]
            const admission = activeAdmission
              ? { ...activeAdmission, patient: activePatientById.get(activeAdmission.patientId) ?? { name: "Unknown patient" } }
              : null
            return { ...rest, admission }
          }),
        })),
        totalBeds,
        availableBeds: allBeds.filter((b) => b.status === "available").length,
        occupiedBeds,
        maintenanceBeds: allBeds.filter((b) => b.status === "maintenance").length,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      }
    })

    return NextResponse.json(wardsWithStats)
  } catch (error) {
    console.error("GET wards error:", error)
    return NextResponse.json({ error: "Failed to fetch wards" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = wardSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const ward = await prisma.ward.create({ data: parsed.data })
    return NextResponse.json(ward, { status: 201 })
  } catch (error) {
    console.error("POST ward error:", error)
    return NextResponse.json({ error: "Failed to create ward" }, { status: 500 })
  }
}
