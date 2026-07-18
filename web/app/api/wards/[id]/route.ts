import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const wardUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["general", "icu", "emergency", "private"]).optional(),
  floor: z.number().int().min(1).max(50).optional(),
  noOfBeds: z.number().int().min(0).max(500).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ward = await prisma.ward.findUnique({
      where: { id },
      include: {
        rooms: {
          where: { OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }] },
          include: {
            beds: {
              where: { OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }] },
              include: {
                // Current occupant only (a bed has many admissions over
                // time). Patient is resolved separately below — some
                // admissions point at a patientId whose Patient no longer
                // exists, and Prisma's include throws "Field patient is
                // required ... got null" the moment one of those is touched.
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
    })

    if (!ward) {
      return NextResponse.json({ error: "Ward not found" }, { status: 404 })
    }

    const activePatientIds = [
      ...new Set(ward.rooms.flatMap((room) => room.beds.flatMap((bed) => bed.admissions.map((a) => a.patientId)))),
    ]
    const activePatients = await prisma.patient.findMany({ where: { id: { in: activePatientIds } } })
    const activePatientById = new Map(activePatients.map((p) => [p.id, p]))

    const wardWithPatients = {
      ...ward,
      rooms: ward.rooms.map((room) => ({
        ...room,
        beds: room.beds.map((bed) => ({
          ...bed,
          admissions: bed.admissions.map((a) => ({
            ...a,
            patient: activePatientById.get(a.patientId) ?? { name: "Unknown patient" },
          })),
        })),
      })),
    }

    return NextResponse.json(wardWithPatients)
  } catch (error) {
    console.error("GET ward error:", error)
    return NextResponse.json({ error: "Failed to fetch ward" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = wardUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const ward = await prisma.ward.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json(ward)
  } catch (error) {
    console.error("PUT ward error:", error)
    return NextResponse.json({ error: "Failed to update ward" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const bedsInWard = await prisma.bed.count({
      where: { room: { wardId: id }, status: "occupied" },
    })

    if (bedsInWard > 0) {
      return NextResponse.json(
        { error: "Cannot delete ward with occupied beds" },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)
    const deletedBy = session?.user?.id
    const deletedAt = new Date()

    await prisma.bed.updateMany({ where: { room: { wardId: id } }, data: { isDeleted: true, deletedAt, deletedBy } })
    await prisma.room.updateMany({ where: { wardId: id }, data: { isDeleted: true, deletedAt, deletedBy } })
    await prisma.ward.update({ where: { id }, data: { isDeleted: true, deletedAt, deletedBy } })

    return NextResponse.json({ message: "Ward deleted" })
  } catch (error) {
    console.error("DELETE ward error:", error)
    return NextResponse.json({ error: "Failed to delete ward" }, { status: 500 })
  }
}
