import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const roomSchema = z.object({
  wardId: z.string().min(1, "Ward is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  type: z.enum(["general", "private", "semi_private"]).default("general"),
  bedCount: z.number().int().min(1, "Must have at least 1 bed").max(20, "Maximum 20 beds per room"),
  chargesPerDay: z.number().min(0, "Charges must be positive"),
  autoCreateBeds: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = roomSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { wardId, roomNumber, type, bedCount, chargesPerDay, autoCreateBeds } = parsed.data

    const room = await prisma.room.create({
      data: { wardId, roomNumber, type, bedCount, chargesPerDay },
    })

    if (autoCreateBeds && bedCount > 0) {
      const bedPromises = Array.from({ length: bedCount }, (_, i) =>
        prisma.bed.create({
          data: {
            roomId: room.id,
            bedNumber: `B${i + 1}`,
            status: "available",
          },
        })
      )
      await Promise.all(bedPromises)
    }

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error("POST room error:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}
