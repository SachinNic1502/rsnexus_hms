import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const wardUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["general", "icu", "emergency", "private"]).optional(),
  floor: z.number().int().min(1).max(50).optional(),
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
          include: {
            beds: {
              include: {
                admission: {
                  include: { patient: true, doctor: { include: { user: true } } },
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

    return NextResponse.json(ward)
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

    await prisma.bed.deleteMany({ where: { room: { wardId: id } } })
    await prisma.room.deleteMany({ where: { wardId: id } })
    await prisma.ward.delete({ where: { id } })

    return NextResponse.json({ message: "Ward deleted" })
  } catch (error) {
    console.error("DELETE ward error:", error)
    return NextResponse.json({ error: "Failed to delete ward" }, { status: 500 })
  }
}
