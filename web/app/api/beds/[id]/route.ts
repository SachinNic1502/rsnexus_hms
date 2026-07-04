import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const createBedSchema = z.object({
  roomId: z.string().min(1, "Room is required"),
  bedNumber: z.string().min(1, "Bed number is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createBedSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const bed = await prisma.bed.create({
      data: {
        ...parsed.data,
        status: "available",
      },
    })
    return NextResponse.json(bed, { status: 201 })
  } catch (error) {
    console.error("POST bed error:", error)
    return NextResponse.json({ error: "Failed to create bed" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bed = await prisma.bed.findUnique({ where: { id } })
    if (!bed) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (bed.status === "occupied") {
      return NextResponse.json({ error: "Cannot delete occupied bed" }, { status: 400 })
    }
    const session = await getServerSession(authOptions)
    await prisma.bed.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: session?.user?.id },
    })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
