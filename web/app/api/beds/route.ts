import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wardId = searchParams.get("wardId")
    const status = searchParams.get("status")

    const where: any = {}
    if (wardId) where.room = { wardId }
    if (status) where.status = status

    const beds = await prisma.bed.findMany({
      where,
      include: {
        room: { include: { ward: true } },
      },
      orderBy: { bedNumber: "asc" },
    })

    return NextResponse.json(beds)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch beds" }, { status: 500 })
  }
}
