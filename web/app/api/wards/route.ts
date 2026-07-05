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
      where: { isDeleted: { isSet: false } },
      include: {
        rooms: {
          where: { isDeleted: { isSet: false } },
          include: {
            beds: { where: { isDeleted: { isSet: false } } },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    const wardsWithStats = wards.map((ward) => {
      const allBeds = ward.rooms.flatMap((room) => room.beds)
      return {
        ...ward,
        totalBeds: allBeds.length,
        availableBeds: allBeds.filter((b) => b.status === "available").length,
        occupiedBeds: allBeds.filter((b) => b.status === "occupied").length,
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
